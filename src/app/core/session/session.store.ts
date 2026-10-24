import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { SessionCache } from '../../shared/resource/session-cache';
import { ParentApi } from '../api/parent-api';
import { Bootstrap, Child } from './bootstrap.schema';

/** idle : rien chargé · loaded : session ouverte · error : réseau ou réponse invalide. */
export type SessionStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface SessionState {
  status: SessionStatus;
  bootstrap: Bootstrap | null;
}

const initialState: SessionState = { status: 'idle', bootstrap: null };

/**
 * Session du parent : identité, école et enfants issus du bootstrap, chargé une fois par session.
 * Ne détient pas l'enfant courant, qui vit dans l'URL (/c/:childId/…, invariant 3).
 */
export const SessionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ bootstrap }) => ({
    parent: computed(() => bootstrap()?.parent ?? null),
    school: computed(() => bootstrap()?.school ?? null),
    academicYear: computed(() => bootstrap()?.academicYear ?? null),
    children: computed(() => bootstrap()?.children ?? []),
  })),
  withMethods((store, api = inject(ParentApi), cache = inject(SessionCache)) => {
    let pending: Promise<SessionStatus> | null = null;

    async function load(): Promise<SessionStatus> {
      patchState(store, { status: 'loading' });
      try {
        const bootstrap = await firstValueFrom(api.bootstrap());
        patchState(store, { status: 'loaded', bootstrap });
      } catch {
        // Un 401 est aussi traité par l'intercepteur (retour à la connexion).
        patchState(store, { status: 'error', bootstrap: null });
      }
      pending = null;
      return store.status();
    }

    /** Ferme la session côté client : la mémoire des lectures part avec elle. */
    function reset(): void {
      pending = null;
      cache.clear();
      patchState(store, initialState);
    }

    return {
      /** Les appels concurrents partagent la même requête. */
      ensureLoaded(): Promise<SessionStatus> {
        if (store.status() === 'loaded') return Promise.resolve('loaded');
        pending ??= load();
        return pending;
      },
      childById(childId: string): Child | undefined {
        return store.children().find((child) => child.childId === childId);
      },
      /**
       * Le compte de non-lues d'un enfant, tel que le serveur vient de le rendre (lecture d'une
       * annonce, liste relue) : badges à jour sans relire le bootstrap.
       */
      setUnreadAnnouncements(childId: string, unreadAnnouncements: number): void {
        const bootstrap = store.bootstrap();
        if (!bootstrap) return;
        patchState(store, {
          bootstrap: {
            ...bootstrap,
            children: bootstrap.children.map((child) =>
              child.childId === childId ? { ...child, unreadAnnouncements } : child,
            ),
          },
        });
      },
      reset,
      async logout(): Promise<void> {
        try {
          await firstValueFrom(api.closeSession());
        } finally {
          reset();
        }
      },
    };
  }),
);
