import { formatNumber } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';

export type GradeLevel = 'good' | 'fair' | 'low';

/**
 * Code couleur des notes, seule exception documentée à « aucun calcul métier côté front » :
 * vert à partir de 60 % (12/20), bleu de 50 à 60 %, terre cuite sous 50 %. Le barème est
 * celui de la note (« 7/10 » se colore comme « 14/20 »).
 */
export function gradeLevel(points: number, maxPoints: number): GradeLevel {
  const ratio = maxPoints > 0 ? points / maxPoints : 0;
  if (ratio >= 0.6) return 'good';
  if (ratio >= 0.5) return 'fair';
  return 'low';
}

/** Une note sur son barème (« 13,5/20 »), à la couleur de son niveau ; lue « 13,5 sur 20 ». */
@Component({
  selector: 'ui-grade',
  template: `
    <span aria-hidden="true"
      >{{ value() }}<span class="max">/{{ max() }}</span></span
    >
    <span class="visually-hidden">{{ spoken() }}</span>
  `,
  styles: `
    :host {
      display: inline-block;
      color: var(--grade-color);
      font-feature-settings: 'tnum';
      font-weight: var(--weight-bold);
      white-space: nowrap;
    }
    :host(.large) {
      font-family: var(--font-title);
      font-size: 1.625rem;
      font-weight: var(--weight-semibold);
      line-height: 1.1;
    }
    .max {
      font-size: 0.8em;
    }
  `,
  host: {
    '[class.large]': "size() === 'large'",
    '[style.--grade-color]': "'var(--color-grade-' + level() + ')'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradeComponent {
  readonly points = input.required<number>();
  readonly maxPoints = input.required<number>();
  readonly size = input<'small' | 'large'>('small');

  private readonly locale = inject(LOCALE_ID);

  protected readonly level = computed(() => gradeLevel(this.points(), this.maxPoints()));
  protected readonly value = computed(() => this.format(this.points()));
  protected readonly max = computed(() => this.format(this.maxPoints()));
  protected readonly spoken = computed(() => `${this.value()} sur ${this.max()}`);

  private format(value: number): string {
    return formatNumber(value, this.locale, '1.0-2');
  }
}
