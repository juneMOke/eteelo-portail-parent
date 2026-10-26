import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { returnPathOf } from './return-path';
import { SessionStore } from './session.store';

/**
 * Exige une session ouverte ; charge le bootstrap avant que les gardes enfants ne lisent la liste.
 * Sans session, la page d'enfant demandée (un lien « Lire dans le portail ») suit la connexion.
 */
export const sessionGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);
  const status = await inject(SessionStore).ensureLoaded();
  if (status === 'loaded') return true;
  const returnPath = returnPathOf(state.url);
  return router.createUrlTree(['/login'], {
    queryParams: {
      ...(status === 'error' ? { error: 'network' } : {}),
      ...(returnPath ? { returnPath } : {}),
    },
  });
};
