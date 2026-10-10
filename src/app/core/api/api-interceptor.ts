/*
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from 'vitest';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const session = inject(SessionStore);
  return next(req).pipe(
    catchError((e: HttpErrorResponse) => {
      if (e.status === 401 && !req.url.startsWith('/api/parent/auth/')) {
        session.reset();
        router.navigate(['/connexion']);
      }
      return throwError(() => e);
    }),
  );
};
*/
