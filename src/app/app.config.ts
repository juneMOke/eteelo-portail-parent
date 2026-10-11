import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import {
  ApplicationConfig,
  isDevMode,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { apiInterceptor } from './core/api/api.interceptor';
import { DEV_BACKEND_INTERCEPTORS } from './core/api/dev-backend';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    // Pas de withFetch() : le backend fetch ne remonte pas la progression d'upload (dépôt de devoir).
    provideHttpClient(
      withInterceptors([apiInterceptor, ...DEV_BACKEND_INTERCEPTORS]),
      withXsrfConfiguration({ cookieName: '__Host-XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
    ),
    { provide: LOCALE_ID, useValue: 'fr' },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
