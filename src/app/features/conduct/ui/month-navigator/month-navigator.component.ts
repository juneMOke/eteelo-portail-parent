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
import { AttendanceMonth } from '../../../../core/api/conduct.contract';
import {
  CivilDate,
  CivilMonth,
  addMonths,
  firstDayOf,
  monthOf,
} from '../../../../shared/date/civil-date';
import { monthLabel } from '../../../../shared/format/day-labels';
import { PeriodNavigatorComponent } from '../../../../shared/ui/period-navigator/period-navigator.component';
import { MonthBounds } from '../../data-access/attendance-view';
import { monthSummary } from '../../data-access/attendance-formats';

/**
 * ③ Le seul curseur de temps de Ma présence, au pas d'un mois : « Septembre 2026 » et ses
 * comptes. Du mois de la rentrée au mois en cours ; « Ce mois-ci » est masqué quand on y est.
 */
@Component({
  selector: 'app-month-navigator',
  imports: [PeriodNavigatorComponent],
  template: `
    <ui-period-navigator
      [label]="label()"
      [meta]="meta()"
      previousLabel="Mois précédent"
      nextLabel="Mois suivant"
      [hasPrevious]="month() > bounds().first"
      [hasNext]="month() < bounds().last"
      [value]="value()"
      [min]="min()"
      [max]="today()"
      currentLabel="Ce mois-ci"
      [showCurrent]="month() !== bounds().last"
      [announcement]="label() + ', ' + meta()"
      (step)="step($event)"
      (pick)="monthChange.emit(monthOf($event))"
      (current)="monthChange.emit(bounds().last)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthNavigatorComponent {
  readonly month = input.required<CivilMonth>();
  readonly bounds = input.required<MonthBounds>();
  /** Jour de l'école : borne du saut de date. */
  readonly today = input.required<CivilDate>();
  /** Comptes du mois, servis par le serveur. */
  readonly counts = input<AttendanceMonth | undefined>(undefined);
  readonly monthChange = output<CivilMonth>();

  private readonly locale = inject(LOCALE_ID);
  private readonly navigator = viewChild.required(PeriodNavigatorComponent);

  protected readonly monthOf = monthOf;
  protected readonly label = computed(() => monthLabel(this.month(), this.locale));
  protected readonly meta = computed(() => monthSummary(this.counts()));
  protected readonly value = computed(() => firstDayOf(this.month()));
  protected readonly min = computed(() => firstDayOf(this.bounds().first));

  /** À la borne, la flèche se désactive et perd le focus : on le rend au libellé. */
  protected step(direction: 1 | -1): void {
    const target = addMonths(this.month(), direction);
    this.monthChange.emit(target);
    const { first, last } = this.bounds();
    if (target <= first || target >= last) this.navigator().focusLabel();
  }
}
