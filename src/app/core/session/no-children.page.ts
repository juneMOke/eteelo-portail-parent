import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { PushStore } from '../push/push.store';
import { SessionStore } from './session.store';

/** Session ouverte mais aucun élève visible : écran dédié, ni alertes ni tuiles. */
@Component({
  selector: 'app-no-children-page',
  imports: [EmptyStateComponent],
  template: `
    <main>
      <ui-empty-state
        heading="Aucun élève n’est rattaché à ce compte"
        message="Rapprochez-vous du secrétariat de l’école pour rattacher votre enfant à ce numéro."
      >
        <button type="button" class="button" (click)="logout()">Se déconnecter</button>
      </ui-empty-state>
    </main>
  `,
  styles: `
    main {
      width: min(560px, 100%);
      margin: 0 auto;
      padding: var(--space-8) var(--space-4);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NoChildrenPage {
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly push = inject(PushStore);

  protected async logout(): Promise<void> {
    this.push.forget();
    // La session locale est vidée même si le serveur ne répond pas.
    await this.session.logout().catch(() => undefined);
    await this.router.navigateByUrl('/login');
  }
}
