import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { GradeAverage } from '../../../../core/api/grades.contract';
import { percentLabel } from '../../data-access/grade-formats';
import { averageColor } from '../../data-access/grade-state';

/**
 * Une moyenne en pourcentage (« 64,5 % »), en Lora à chiffres tabulaires, à la couleur du ton
 * que le serveur lui donne ; la couleur change en fondu avec la sélection. « — » quand le cours
 * n'a pas encore de note.
 */
@Component({
  selector: 'app-average',
  template: `{{ label() }}`,
  styles: `
    :host {
      color: var(--average-color);
      transition: color var(--duration-tint) var(--ease-out);
      font-family: var(--font-title);
      font-feature-settings: 'tnum';
      font-weight: var(--weight-semibold);
      line-height: 1.1;
      white-space: nowrap;
    }
    :host(.md) {
      font-size: 1.0625rem;
    }
    :host(.lg) {
      font-size: var(--text-lg);
    }
    :host(.xl) {
      font-size: 2.5rem;
    }
  `,
  host: {
    '[class]': 'size()',
    '[style.--average-color]': 'color()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AverageComponent {
  readonly average = input.required<Pick<GradeAverage, 'percent' | 'state'> | null>();
  readonly size = input<'md' | 'lg' | 'xl'>('md');

  private readonly locale = inject(LOCALE_ID);

  protected readonly label = computed(() => {
    const average = this.average();
    return average ? percentLabel(average.percent, this.locale) : '—';
  });
  protected readonly color = computed(() => averageColor(this.average()?.state ?? null));
}
