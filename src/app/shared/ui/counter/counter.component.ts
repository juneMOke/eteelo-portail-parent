import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Pastille de compte (« 2 ») au bout d'une entrée : les annonces non lues. Rien à zéro. Le chiffre
 * se lit avec son nom (« 2 nouveaux »), au-delà de 9 il s'affiche « 9+ ». Le parent la place
 * (`ui-counter { margin-left: auto }`) ; à zéro, elle ne prend aucune place.
 */
@Component({
  selector: 'ui-counter',
  template: `
    @if (count() > 0) {
      <span class="bubble" aria-hidden="true">{{ shown() }}</span>
      <span class="visually-hidden">, {{ spoken() }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
    .bubble {
      display: inline-grid;
      flex: none;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      place-items: center;
      border-radius: var(--radius-pill);
      background: var(--color-accent);
      color: var(--color-on-tone);
      font-size: var(--text-xs);
      font-variant-numeric: tabular-nums;
      font-weight: var(--weight-semibold);
      line-height: 1;
    }
  `,
  host: { '[style.display]': "count() > 0 ? null : 'none'" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent {
  readonly count = input.required<number>();
  /** Le nom du compte, au singulier et au pluriel. */
  readonly one = input('nouveau');
  readonly many = input('nouveaux');

  protected readonly shown = computed(() => (this.count() > 9 ? '9+' : String(this.count())));
  protected readonly spoken = computed(
    () => `${this.count()} ${this.count() === 1 ? this.one() : this.many()}`,
  );
}
