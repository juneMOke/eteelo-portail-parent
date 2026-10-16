import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AttendanceDay } from '../../../../core/api/conduct.contract';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import {
  deadlineLabel,
  justificationLabel,
  momentLabel,
  reasonLabel,
  recordedLabel,
} from '../../data-access/attendance-formats';
import { caseParams, disciplineLink } from '../../data-access/conduct-links';
import { DAY_STATES, dayState } from '../../data-access/day-state';
import { followUpLabel } from '../../data-access/discipline-formats';

/**
 * ④ Ce qui s'est passé un jour : l'état en mot, le moment, le motif retenu, qui a fait
 * l'appel, la justification envoyée, et la suite disciplinaire s'il y en a une. « Justifier »
 * tant que le délai court. Avant l'appel du jour : « pas encore enregistrée », jamais
 * « Présent » par défaut.
 */
@Component({
  selector: 'app-day-detail',
  imports: [BadgeComponent, IconComponent, RouterLink],
  templateUrl: './day-detail.component.html',
  styleUrl: './day-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayDetailComponent {
  readonly childId = input.required<string>();
  /** Undefined : pas d'appel ce jour-là. */
  readonly day = input.required<AttendanceDay | undefined>();
  readonly justify = output<string>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly view = computed(() => {
    const day = this.day();
    if (!day) return null;
    const state = DAY_STATES[dayState(day)];
    const justification = day.justification;
    return {
      date: day.date,
      state,
      moment: momentLabel(day),
      reason: day.justified ? reasonLabel(day.absenceReason, day.absenceReasonNote) : null,
      recorded: recordedLabel(day, this.locale),
      justification: justification ? justificationLabel(justification, this.locale) : null,
      decisionNote: justification?.status === 'REJECTED' ? justification.decisionNote : null,
      deadline:
        day.justifyUntil && justification?.status !== 'PENDING'
          ? deadlineLabel(day.justifyUntil, this.locale)
          : null,
      closed: dayState(day) === 'unexcused' && !day.justifyUntil,
      cases: day.disciplinaryCases.map((item) => ({
        id: item.id,
        label: followUpLabel(item),
        params: caseParams(item),
      })),
    };
  });
  protected readonly disciplineLink = computed(() => disciplineLink(this.childId()));
}
