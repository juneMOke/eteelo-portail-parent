import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionStore } from '../session/session.store';
import { PARENT_AUTH_API, PARENT_CHILDREN_API } from './parent-api';

/**
 * Seul endroit où les refus de session sont traités :
 * - 401 : session réinitialisée, retour à la connexion (sauf sur les routes d'authentification,
 *   dont les pages gèrent l'échec elles-mêmes) ;
 * - 403 sur une route d'enfant : l'enfant n'est plus visible, session rechargée et renvoi
 *   au premier enfant.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStore);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 && !req.url.startsWith(PARENT_AUTH_API)) {
          session.reset();
          void router.navigateByUrl('/login');
        } else if (error.status === 403 && req.url.startsWith(PARENT_CHILDREN_API)) {
          session.reset();
          void router.navigateByUrl('/');
        }
      }
      return throwError(() => error);
    }),
  );
};
