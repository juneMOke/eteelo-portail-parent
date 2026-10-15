import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { GradeWeek } from '../../../../core/api/grades.contract';
import { CivilDate, addDays } from '../../../../shared/date/civil-date';
import { PeriodNavigatorComponent } from '../../../../shared/ui/period-navigator/period-navigator.component';
import { weekLabel, weekSummary } from '../../data-access/grade-formats';

/**
 * ① Navigateur de semaine de Ma semaine : même forme que le navigateur de jour, autre pas.
 * De la semaine de rentrée à la semaine en cours (aucune note n'existe au-delà) ; une date
 * choisie ouvre sa semaine ; « Cette semaine » est masqué quand on y est.
 */
@Component({
  selector: 'app-week-navigator',
  imports: [PeriodNavigatorComponent],
  templateUrl: './week-navigator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekNavigatorComponent {
  readonly week = input.required<GradeWeek>();
  /** Un jour de la semaine demandée. */
  readonly weekChange = output<CivilDate>();

  private readonly locale = inject(LOCALE_ID);
  private readonly navigator = viewChild.required(PeriodNavigatorComponent);

  protected readonly label = computed(() =>
    weekLabel(this.week().weekStart, this.week().weekEnd, this.locale),
  );
  protected readonly summary = computed(() => weekSummary(this.week().summary));
  protected readonly hasPrevious = computed(() => this.week().weekStart > this.week().firstWeek);
  protected readonly hasNext = computed(() => this.week().weekStart < this.week().currentWeek);
  protected readonly lastDay = computed(() => addDays(this.week().currentWeek, 6));

  /** Rend le focus au libellé une fois la nouvelle semaine affichée. */
  focusLabel(): void {
    this.navigator().focusLabel();
  }

  /** À la borne, la flèche se désactive et perd le focus : on le rend au libellé. */
  protected step(direction: 1 | -1): void {
    const target = addDays(this.week().weekStart, 7 * direction);
    this.weekChange.emit(target);
    const { firstWeek, currentWeek } = this.week();
    if (target <= firstWeek || target >= currentWeek) this.focusLabel();
  }
}
