import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../auth-layout/auth-layout.component';
import { AuthFacade } from '../data-access/auth.facade';

/** Consommation du lien reçu sur WhatsApp : ouvre la session puis mène à l'Accueil. */
@Component({
  selector: 'app-magic-link-page',
  imports: [AuthLayoutComponent, RouterLink],
  template: `
    <app-auth-layout>
      <h1>Connexion</h1>
      @if (failed()) {
        <p class="alert" role="alert">Ce lien n’est plus valide. Demandez-en un nouveau.</p>
        <a class="button" routerLink="/login">Recevoir un nouveau lien</a>
      } @else {
        <p role="status" aria-busy="true">Connexion en cours…</p>
      }
    </app-auth-layout>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MagicLinkPage implements OnInit {
  readonly token = input.required<string>();

  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

  protected readonly failed = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      await this.auth.openSession(this.token());
      await this.router.navigateByUrl('/', { replaceUrl: true });
    } catch {
      this.failed.set(true);
    }
  }
}
