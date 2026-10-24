import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { returnPathOf } from '../session/return-path';
import { SessionStore } from '../session/session.store';
import { CHILD_NOT_VISIBLE, detailCodeOf } from './api-error';
import { PARENT_AUTH_API, PARENT_CHILDREN_API } from './parent-api';

/**
 * Seul endroit où les refus de session sont traités :
 * - 401 : session réinitialisée, retour à la connexion (sauf sur les routes d'authentification,
 *   dont les pages gèrent l'échec elles-mêmes), la page d'enfant demandée en adresse de retour ;
 * - 403 du garde par enfant (`CHILD_NOT_VISIBLE`) : l'enfant n'est plus visible, session
 *   rechargée et renvoi au premier enfant. Un autre 403 (jeton CSRF absent ou périmé sur un
 *   POST) reste à la page qui l'a provoqué.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStore);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 && !req.url.startsWith(PARENT_AUTH_API)) {
          session.reset();
          void router.navigateByUrl(loginUrl(router));
        } else if (isChildRefusal(error) && req.url.startsWith(PARENT_CHILDREN_API)) {
          session.reset();
          void router.navigateByUrl('/');
        }
      }
      return throwError(() => error);
    }),
  );
};

/** La connexion, avec la page d'enfant en cours d'ouverture (ou affichée) pour y revenir. */
function loginUrl(router: Router): string {
  const requested = router.currentNavigation()?.extractedUrl.toString() ?? router.url;
  const returnPath = returnPathOf(requested);
  return returnPath ? `/login?returnPath=${encodeURIComponent(returnPath)}` : '/login';
}

function isChildRefusal(error: HttpErrorResponse): boolean {
  return error.status === 403 && detailCodeOf(error) === CHILD_NOT_VISIBLE;
}
