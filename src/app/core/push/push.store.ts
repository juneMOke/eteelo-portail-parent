import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ParentApi } from '../api/parent-api';
import { AnnouncementPushData } from '../api/push.contract';
import { SessionStore } from '../session/session.store';
import { PushDevice, subscriptionBody } from './push-device';
import { announcementPush, pushedData } from './push-payload';

/**
 * idle : pas encore vérifié · hidden : rien à proposer (serveur ou navigateur) ·
 * install-first : iPhone, portail à ajouter à l'écran d'accueil · available : à activer ·
 * denied : bloquées par le navigateur · enabled : ce téléphone est abonné.
 */
export type PushStatus = 'idle' | 'hidden' | 'install-first' | 'available' | 'denied' | 'enabled';

/** Une annonce arrivée par notification, portail ouvert : sa liste est à relire. */
export interface PushArrival {
  readonly childId: string;
  readonly announcementId: string;
}

interface PushState {
  status: PushStatus;
  /** Activation ou désactivation en cours. */
  busy: boolean;
  /** La dernière activation ou désactivation a échoué. */
  failed: boolean;
  /** Parent dont l'état a été vérifié : un autre parent sur ce téléphone revérifie. */
  parentId: string | null;
  arrival: PushArrival | null;
}

const initialState: PushState = {
  status: 'idle',
  busy: false,
  failed: false,
  parentId: null,
  arrival: null,
};

/**
 * Les notifications du portail sur ce téléphone : activation à la demande du parent (jamais à
 * l'ouverture), abonnement renvoyé au serveur à chaque session (le navigateur le renouvelle
 * parfois sans prévenir), désactivation. Portail ouvert, une notification met la pastille de
 * l'enfant au compte du serveur ; un appui ouvre l'annonce sans recharger la page.
 */
export const PushStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(
    (
      store,
      api = inject(ParentApi),
      device = inject(PushDevice),
      session = inject(SessionStore),
    ) => {
      function received(data: AnnouncementPushData): void {
        session.setUnreadAnnouncements(data.childId, data.unreadAnnouncements);
        patchState(store, {
          arrival: { childId: data.childId, announcementId: data.announcementId },
        });
      }

      return {
        /** À l'ouverture d'une session : l'état de ce téléphone, l'abonnement renvoyé au serveur. */
        async init(): Promise<void> {
          const parentId = session.parent()?.parentId ?? null;
          if (!parentId || store.parentId() === parentId) return;
          patchState(store, { parentId, status: 'idle', failed: false });
          const config = session.bootstrap()?.push;
          if (!config || device.support === 'unsupported') {
            patchState(store, { status: 'hidden' });
            return;
          }
          if (device.support === 'install-first') {
            patchState(store, { status: 'install-first' });
            return;
          }
          if (device.permission() === 'denied') {
            patchState(store, { status: 'denied' });
            return;
          }
          const subscription = await device.current().catch(() => null);
          if (store.parentId() !== parentId) return;
          const body = subscription && subscriptionBody(subscription);
          if (!body || device.permission() !== 'granted') {
            patchState(store, { status: 'available' });
            return;
          }
          patchState(store, { status: 'enabled' });
          // Un échec ici n'empêche rien : le serveur garde l'abonnement déjà connu.
          await firstValueFrom(api.savePushSubscription(body)).catch(() => undefined);
        },

        async enable(): Promise<void> {
          const config = session.bootstrap()?.push;
          if (!config || store.busy()) return;
          patchState(store, { busy: true, failed: false });
          try {
            const permission = await device.requestPermission();
            if (permission !== 'granted') {
              // Fenêtre fermée sans choix : la carte reste proposée.
              patchState(store, { status: permission === 'denied' ? 'denied' : 'available' });
              return;
            }
            const subscription = await device.subscribe(config.vapidPublicKey);
            const body = subscriptionBody(subscription);
            try {
              if (!body) throw new Error('Abonnement sans clés');
              await firstValueFrom(api.savePushSubscription(body));
            } catch (error) {
              // Le serveur ne le connaît pas : ne pas laisser un abonnement muet sur le téléphone.
              await subscription.unsubscribe().catch(() => false);
              throw error;
            }
            patchState(store, { status: 'enabled' });
          } catch {
            patchState(store, { status: 'available', failed: true });
          } finally {
            patchState(store, { busy: false });
          }
        },

        async disable(): Promise<void> {
          if (store.busy()) return;
          patchState(store, { busy: true, failed: false });
          try {
            const endpoint = await device.unsubscribe();
            // Un échec ici est sans suite : le service de push refusera l'abonnement (410).
            if (endpoint) {
              await firstValueFrom(api.deletePushSubscription(endpoint)).catch(() => undefined);
            }
            patchState(store, { status: 'available' });
          } catch {
            patchState(store, { failed: true });
          } finally {
            patchState(store, { busy: false });
          }
        },

        /**
         * Déconnexion : ce téléphone n'est plus abonné. Le serveur retire de son côté les
         * abonnements de la session fermée ; rien à attendre ici.
         */
        forget(): void {
          patchState(store, initialState);
          void device.unsubscribe().catch(() => null);
        },

        /** Une notification d'annonce reçue ou touchée pendant que le portail est ouvert. */
        received,
      };
    },
  ),
  withHooks((store, swPush = inject(SwPush), router = inject(Router)) => ({
    onInit(): void {
      swPush.messages.pipe(takeUntilDestroyed()).subscribe((message) => {
        const data = announcementPush(pushedData(message));
        if (data) store.received(data);
      });
      swPush.notificationClicks.pipe(takeUntilDestroyed()).subscribe(({ notification }) => {
        const data = announcementPush(notification.data);
        if (!data) return;
        store.received(data);
        void router.navigateByUrl(data.onActionClick.default.url);
      });
    },
  })),
);
