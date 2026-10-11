import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Salutation (le seul moment chaleureux de la page, pas un titre) et date du jour. */
@Component({
  selector: 'app-greeting',
  imports: [DatePipe],
  template: `
    <p class="hello">{{ greeting() }}</p>
    <p class="meta">{{ today() | date: 'EEEE d MMMM y' }} · {{ childLabel() }}</p>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .hello {
      color: var(--color-heading);
      font-family: var(--font-title);
      font-size: var(--text-xl);
      font-weight: var(--weight-semibold);
      line-height: 1.3;
    }
    .meta {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }
    .meta::first-letter {
      text-transform: uppercase;
    }
    @media (min-width: 905px) {
      .hello {
        font-size: var(--text-2xl);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GreetingComponent {
  readonly greeting = input.required<string>();
  readonly childLabel = input.required<string>();
  readonly today = input.required<Date>();
}
