import { HttpXsrfTokenExtractor } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ParentApi } from '../../../core/api/parent-api';
import { returnPathOf } from '../../../core/session/return-path';
import { SessionStore } from '../../../core/session/session.store';

/**
 * Façade de la connexion par lien WhatsApp.
 * Toute écriture exige le jeton CSRF (cookie __Host-XSRF-TOKEN, XSRF-TOKEN contre le back local) : s'il manque, un appel à
 * GET /auth/me le fait poser avant le premier POST.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly api = inject(ParentApi);
  private readonly session = inject(SessionStore);
  private readonly xsrf = inject(HttpXsrfTokenExtractor);

  /** Le lien mènera à `returnPath` (une page d'enfant demandée sans session), sinon à l'Accueil. */
  async requestLink(phoneNumber: string, returnPath?: string | null): Promise<void> {
    await this.ensureXsrfToken();
    const path = returnPathOf(returnPath);
    await firstValueFrom(
      this.api.requestMagicLink(path ? { phoneNumber, returnPath: path } : { phoneNumber }),
    );
  }

  /**
   * Ouvre la session ; le bootstrap sera rechargé pour ce parent. Rend la page où mène le lien,
   * revérifiée ici pour ne jamais sortir du portail, ou null pour l'Accueil.
   */
  async openSession(token: string): Promise<string | null> {
    await this.ensureXsrfToken();
    const identity = await firstValueFrom(this.api.openSession({ token }));
    this.session.reset();
    return returnPathOf(identity.returnPath);
  }

  private async ensureXsrfToken(): Promise<void> {
    if (this.xsrf.getToken()) return;
    // Sans session, /auth/me répond 401 mais pose quand même le cookie du jeton.
    await firstValueFrom(this.api.currentHolder()).catch(() => undefined);
  }
}
