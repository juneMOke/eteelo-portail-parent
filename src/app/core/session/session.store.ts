import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
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
    children: computed(() => bootstrap()?.children ?? []),
  })),
  withMethods((store, api = inject(ParentApi)) => {
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

    function reset(): void {
      pending = null;
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
