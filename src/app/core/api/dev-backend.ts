import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Intercepteurs de développement. Vide en temps normal ; remplacé par dev-backend.mock.ts
 * dans la configuration `mock` (`npm run start:mock`), qui sert des données factices
 * tant que les contrats du lot back P1 ne sont pas sur staging.
 */
export const DEV_BACKEND_INTERCEPTORS: HttpInterceptorFn[] = [];
