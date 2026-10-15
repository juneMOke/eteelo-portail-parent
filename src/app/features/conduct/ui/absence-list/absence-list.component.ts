import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { AttendanceDay } from '../../../../core/api/conduct.contract';
import { dayLabel } from '../../../../shared/format/day-labels';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { momentLabel } from '../../data-access/attendance-formats';
import { DAY_STATES, dayState } from '../../data-access/day-state';

/**
 * ⑤ Absences et retards du mois, le plus récent en haut : l'équivalent textuel du calendrier,
 * avec les heures d'arrivée. Les jours présents n'y figurent pas. Une ligne ouvre la fiche.
 */
@Component({
  selector: 'app-absence-list',
  imports: [IconComponent],
  templateUrl: './absence-list.component.html',
  styleUrl: './absence-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbsenceListComponent {
  /** Déjà filtrés et rangés. */
  readonly days = input.required<readonly AttendanceDay[]>();
  /** « septembre », pour le mois sans absence ni retard. */
  readonly monthName = input.required<string>();
  readonly open = output<string>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly lines = computed(() =>
    this.days().map((day) => {
      const state = DAY_STATES[dayState(day)];
      const moment = day.status === 'LATE' ? ` · ${momentLabel(day).toLowerCase()}` : '';
      return {
        date: day.date,
        label: dayLabel(day.date, this.locale),
        detail: `${state.label}${moment}`,
        tone: state.tone,
      };
    }),
  );
}
