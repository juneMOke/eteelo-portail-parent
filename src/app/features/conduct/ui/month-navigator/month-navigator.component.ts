import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { AttendanceMonth } from '../../../../core/api/conduct.contract';
import { CivilMonth, addMonths } from '../../../../shared/date/civil-date';
import { RelativeWeek } from '../../../../shared/format/relative-week';
import { monthLabel } from '../../../../shared/format/day-labels';
import { WIDE_SCREEN, mediaQuery } from '../../../../shared/layout/media-query';
import { WeekBannerComponent } from '../../../../shared/ui/week-banner/week-banner.component';
import { MonthBounds } from '../../data-access/attendance-view';
import { monthSummary } from '../../data-access/attendance-formats';

/**
 * ③ Le curseur du mois : le bandeau bleu de la semaine, au pas d'un mois, puis les comptes du
 * mois servis par le serveur. Du mois de la rentrée au mois en cours ; la pilule de retour est
 * masquée quand on y est.
 */
@Component({
  selector: 'app-month-navigator',
  imports: [WeekBannerComponent],
  template: `
    <ui-week-banner
      [label]="label()"
      [shortLabel]="label()"
      [relative]="relative()"
      [hasPrevious]="month() > bounds().first"
      [hasNext]="month() < bounds().last"
      [isCurrent]="month() === bounds().last"
      [wide]="wide()"
      previousLabel="Mois précédent"
      nextLabel="Mois suivant"
      currentLabel="Revenir à ce mois-ci"
      [announcement]="label() + ', ' + meta()"
      (step)="monthChange.emit(addMonths(month(), $event))"
      (current)="monthChange.emit(bounds().last)"
    />
    <p class="meta">{{ meta() }}</p>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    /* « 21 jours d'école · 1 absence · 2 retards », sous le bandeau. */
    .meta {
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthNavigatorComponent {
  readonly month = input.required<CivilMonth>();
  readonly bounds = input.required<MonthBounds>();
  /** « ce mois-ci », « mois passé ». */
  readonly relative = input.required<RelativeWeek>();
  /** Comptes du mois, servis par le serveur. */
  readonly counts = input<AttendanceMonth | undefined>(undefined);
  readonly monthChange = output<CivilMonth>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly wide = mediaQuery(WIDE_SCREEN);
  protected readonly addMonths = addMonths;
  protected readonly label = computed(() => monthLabel(this.month(), this.locale));
  protected readonly meta = computed(() => monthSummary(this.counts()));
}
