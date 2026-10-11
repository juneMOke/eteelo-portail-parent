import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Surface blanche bordée : le conteneur commun des blocs de contenu. */
@Component({
  selector: 'ui-card',
  template: '<ng-content />',
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-4);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-card);
    }
    @media (min-width: 905px) {
      :host {
        padding: var(--space-5);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {}
