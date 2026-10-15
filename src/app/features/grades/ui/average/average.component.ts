import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { Average } from '../../../../core/api/grades.contract';
import { gradeLevel } from '../../../../shared/ui/grade/grade.component';
import { percentLabel } from '../../data-access/grade-formats';

/**
 * Une moyenne en pourcentage (« 64,5 % »), en Lora, à la couleur des notes (exception
 * documentée du CLAUDE.md). « — » quand le cours n'a pas encore de note.
 */
@Component({
  selector: 'app-average',
  template: `{{ label() }}`,
  styles: `
    :host {
      color: var(--average-color);
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
  readonly average = input.required<Average | null>();
  readonly size = input<'md' | 'lg' | 'xl'>('md');

  private readonly locale = inject(LOCALE_ID);

  protected readonly label = computed(() => {
    const average = this.average();
    return average ? percentLabel(average.percent, this.locale) : '—';
  });
  protected readonly color = computed(() => {
    const average = this.average();
    return average
      ? `var(--color-grade-${gradeLevel(average.percent, 100)})`
      : 'var(--color-text-muted)';
  });
}
