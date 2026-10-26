import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ParentApi } from '../api/parent-api';
import { detailCodeOf } from '../api/api-error';
import {
  AnnouncementPushData,
  PUSH_ENDPOINT_INVALID,
  PUSH_KEYS_INVALID,
} from '../api/push.contract';
import { Bootstrap } from '../session/bootstrap.schema';
import { SessionStore } from '../session/session.store';
import { PushDevice, subscriptionBody, usesKey } from './push-device';
import { announcementPush, pushedData } from './push-payload';

/**
 * idle : pas encore vérifié · hidden : rien à proposer (serveur ou navigateur) ·
 * install-first : iPhone, portail à ajouter à l'écran d'accueil · available : à activer ·
 * denied : bloquées par le navigateur · enabled : ce téléphone est abonné ·
 * unsupported-service : le serveur refuse le service de push de ce navigateur.
 */
export type PushStatus =
  'idle' | 'hidden' | 'install-first' | 'available' | 'denied' | 'enabled' | 'unsupported-service';

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
  arrival: PushArrival | null;
}

const initialState: PushState = {
  status: 'idle',
  busy: false,
  failed: false,
  arrival: null,
};

/**
 * Les notifications du portail sur ce téléphone : activation à la demande du parent (jamais à
 * l'ouverture), abonnement renvoyé au serveur à chaque ouverture du portail, désactivation.
 * Le renvoi tient l'abonnement hors de la purge des 60 jours (une session dure 90 jours sans
 * être prolongée) et suit les renouvellements silencieux du navigateur. Portail ouvert, une notification met la pastille de
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
      /** Bootstrap déjà vérifié : un nouveau (autre parent, reconnexion) revérifie. */
      let checked: Bootstrap | null = null;

      function received(data: AnnouncementPushData): void {
        session.setUnreadAnnouncements(data.childId, data.unreadAnnouncements);
        patchState(store, {
          arrival: { childId: data.childId, announcementId: data.announcementId },
        });
      }

      return {
        /** Après chaque bootstrap : l'état de ce téléphone, l'abonnement renvoyé au serveur. */
        async init(): Promise<void> {
          const bootstrap = session.bootstrap();
          if (!bootstrap || checked === bootstrap) return;
          checked = bootstrap;
          patchState(store, { status: 'idle', failed: false });
          const config = bootstrap.push;
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
          let subscription = await device.current().catch(() => null);
          if (
            subscription &&
            device.permission() === 'granted' &&
            !usesKey(subscription, config.vapidPublicKey)
          ) {
            // Le serveur a changé de clé : l'ancien abonnement ne recevrait plus rien.
            subscription = await device.subscribe(config.vapidPublicKey).catch(() => null);
          }
          if (checked !== bootstrap) return;
          const body = subscription && subscriptionBody(subscription);
          if (!body || device.permission() !== 'granted') {
            patchState(store, { status: 'available' });
            return;
          }
          patchState(store, { status: 'enabled' });
          try {
            await firstValueFrom(api.savePushSubscription(body));
          } catch (error) {
            // Un échec réseau n'empêche rien : le serveur garde l'abonnement déjà connu.
            if (!refusedByServer(error)) return;
            await subscription?.unsubscribe().catch(() => false);
            patchState(store, { status: 'unsupported-service' });
          }
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
          } catch (error) {
            patchState(
              store,
              refusedByServer(error)
                ? { status: 'unsupported-service' }
                : { status: 'available', failed: true },
            );
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
          checked = null;
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

/** Le serveur refuse ce téléphone pour de bon (service de push inconnu, clés illisibles). */
function refusedByServer(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse) || error.status !== 400) return false;
  const code = detailCodeOf(error);
  return code === PUSH_ENDPOINT_INVALID || code === PUSH_KEYS_INVALID;
}
