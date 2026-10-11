import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { CardComponent } from '../../../shared/ui/card/card.component';

/**
 * Cadre commun des pages de connexion : marque ETEELO et carte centrée.
 * Sans encapsulation pour styler le contenu projeté (titre, paragraphes, alertes) une seule fois ;
 * toutes les règles restent préfixées par app-auth-layout.
 */
@Component({
  selector: 'app-auth-layout',
  imports: [CardComponent],
  template: `
    <main>
      <p class="brand">ETEELO <span>CONNECT</span></p>
      <ui-card><ng-content /></ui-card>
    </main>
  `,
  styles: `
    app-auth-layout main {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      width: min(440px, 100%);
      min-height: 100dvh;
      margin: 0 auto;
      padding: var(--space-8) var(--space-4);
      justify-content: center;
    }
    app-auth-layout .brand {
      color: var(--color-heading);
      font-size: var(--text-lg);
      font-weight: var(--weight-bold);
      text-align: center;
    }
    app-auth-layout .brand span {
      color: var(--color-text-muted);
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      letter-spacing: 0.28em;
    }
    app-auth-layout h1 {
      color: var(--color-heading);
      font-family: var(--font-title);
      font-size: var(--text-xl);
      font-weight: var(--weight-semibold);
      line-height: var(--leading-tight);
    }
    app-auth-layout p {
      color: var(--color-text-secondary);
      font-size: var(--text-md);
    }
    app-auth-layout .alert {
      padding: var(--space-3);
      border-left: 3px solid var(--color-attention);
      border-radius: var(--radius-sm);
      background: var(--color-page);
      color: var(--color-text);
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {}
