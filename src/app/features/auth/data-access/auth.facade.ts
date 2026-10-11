import { HttpXsrfTokenExtractor } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';

/**
 * Façade de la connexion par lien WhatsApp.
 * Toute écriture exige le jeton CSRF (cookie __Host-XSRF-TOKEN) : s'il manque, un appel à
 * GET /auth/me le fait poser avant le premier POST.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly api = inject(ParentApi);
  private readonly session = inject(SessionStore);
  private readonly xsrf = inject(HttpXsrfTokenExtractor);

  async requestLink(phoneNumber: string): Promise<void> {
    await this.ensureXsrfToken();
    await firstValueFrom(this.api.requestMagicLink({ phoneNumber }));
  }

  /** Ouvre la session ; le bootstrap sera rechargé pour ce parent. */
  async openSession(token: string): Promise<void> {
    await this.ensureXsrfToken();
    await firstValueFrom(this.api.openSession({ token }));
    this.session.reset();
  }

  private async ensureXsrfToken(): Promise<void> {
    if (this.xsrf.getToken()) return;
    // Sans session, /auth/me répond 401 mais pose quand même le cookie du jeton.
    await firstValueFrom(this.api.currentHolder()).catch(() => undefined);
  }
}
