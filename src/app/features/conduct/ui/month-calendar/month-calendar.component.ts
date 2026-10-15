import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { spokenDay } from '../../../../shared/format/day-labels';
import { CalendarCell } from '../../data-access/attendance-view';
import { DAY_STATES, DayState, spokenState } from '../../data-access/day-state';

const WEEKDAYS = [
  { short: 'L', long: 'lundi' },
  { short: 'M', long: 'mardi' },
  { short: 'M', long: 'mercredi' },
  { short: 'J', long: 'jeudi' },
  { short: 'V', long: 'vendredi' },
  { short: 'S', long: 'samedi' },
  { short: 'D', long: 'dimanche' },
];

/**
 * ③ La grille du mois, du lundi au dimanche : la régularité, et les motifs qui se répètent.
 * Chaque état a sa couleur et son glyphe (point pour un retard, trait pour une absence) ; une
 * cellule qui a quelque chose à dire s'ouvre sur sa fiche. Aujourd'hui est cerclé. Les jours
 * sans appel restent blancs, sans mot. Légende limitée aux états du mois.
 */
@Component({
  selector: 'app-month-calendar',
  templateUrl: './month-calendar.component.html',
  styleUrl: './month-calendar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthCalendarComponent {
  readonly weeks = input.required<readonly (readonly (CalendarCell | null)[])[]>();
  readonly legend = input.required<readonly DayState[]>();
  /** « Septembre 2026 », nom de la grille. */
  readonly caption = input.required<string>();
  readonly open = output<string>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly weekdays = WEEKDAYS;
  protected readonly states = DAY_STATES;
  protected readonly rows = computed(() =>
    this.weeks().map((week) =>
      week.map((cell) => (cell ? { ...cell, name: this.cellName(cell) } : null)),
    ),
  );

  /** « Mercredi 16 septembre, absent, non justifié. » */
  private cellName(cell: CalendarCell): string {
    const day = spokenDay(cell.date, this.locale);
    if (cell.state === 'none') {
      return cell.today ? `${day}, aujourd’hui, présence pas encore enregistrée.` : `${day}.`;
    }
    return `${day}${cell.today ? ', aujourd’hui' : ''}, ${spokenState(cell.state)}.`;
  }
}
