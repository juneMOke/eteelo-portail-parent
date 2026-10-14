import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import {
  ApplicationConfig,
  isDevMode,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withRouterConfig,
} from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { apiInterceptor } from './core/api/api.interceptor';
import { DEV_BACKEND_INTERCEPTORS } from './core/api/dev-backend';
import { PageTitleStrategy } from './core/navigation/page-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      // childId (c/:childId) descend jusqu'aux pages imbriquées, comme assessments/:evaluationId.
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
    // Pas de withFetch() : le backend fetch ne remonte pas la progression d'upload (dépôt de devoir).
    provideHttpClient(
      withInterceptors([apiInterceptor, ...DEV_BACKEND_INTERCEPTORS]),
      // « __Host- » exige Secure : sur http://localhost, le backend (profil dev) nomme le cookie XSRF-TOKEN.
      withXsrfConfiguration({
        cookieName: isDevMode() ? 'XSRF-TOKEN' : '__Host-XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
    ),
    { provide: TitleStrategy, useExisting: PageTitleStrategy },
    { provide: LOCALE_ID, useValue: 'fr' },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
