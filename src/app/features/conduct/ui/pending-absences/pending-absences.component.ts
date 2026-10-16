import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { dayLabel } from '../../../../shared/format/day-labels';
import { PendingAbsence } from '../../data-access/attendance-view';
import { deadlineLabel } from '../../data-access/attendance-formats';

/** Lignes montrées avant « et 1 autre ». */
const VISIBLE = 2;

/**
 * ② « À justifier » : transformer l'inquiétude en geste. Une ligne par absence à justifier
 * dans le délai, avec « Justifier » ; une justification envoyée passe en neutre et reste
 * visible jusqu'à la décision de l'école. Seul accent terre cuite plein de la page ; pas de
 * compte à rebours, pas de rouge.
 */
@Component({
  selector: 'app-pending-absences',
  templateUrl: './pending-absences.component.html',
  styleUrl: './pending-absences.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingAbsencesComponent {
  readonly entries = input.required<readonly PendingAbsence[]>();
  /** Ouvre la feuille de justification du jour. */
  readonly justify = output<string>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly expanded = signal(false);
  protected readonly lines = computed(() =>
    this.entries().map((entry) => ({
      date: entry.date,
      label: dayLabel(entry.date, this.locale),
      detail: entry.justifyUntil
        ? deadlineLabel(entry.justifyUntil, this.locale)
        : 'Justification envoyée · en attente de l’école',
      actionable: !!entry.justifyUntil,
    })),
  );
  protected readonly visible = computed(() =>
    this.expanded() ? this.lines() : this.lines().slice(0, VISIBLE),
  );
  protected readonly hidden = computed(() => this.lines().length - this.visible().length);
  protected readonly heading = computed(() =>
    this.lines().some((line) => line.actionable) ? 'À justifier' : 'Justifications envoyées',
  );
}
