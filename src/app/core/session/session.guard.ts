import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from './session.store';

/** Exige une session ouverte ; charge le bootstrap avant que les gardes enfants ne lisent la liste. */
export const sessionGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const status = await inject(SessionStore).ensureLoaded();
  if (status === 'loaded') return true;
  return router.createUrlTree(['/login'], {
    queryParams: status === 'error' ? { error: 'network' } : {},
  });
};
