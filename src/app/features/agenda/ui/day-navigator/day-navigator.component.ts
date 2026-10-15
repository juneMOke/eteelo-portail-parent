import { formatDate } from '@angular/common';
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
import { AssignmentWindow, CivilDate } from '../../../../core/api/assignments.contract';
import { civilToDate } from '../../../../shared/date/civil-date';
import { PeriodNavigatorComponent } from '../../../../shared/ui/period-navigator/period-navigator.component';
import { inWindow, relativeDay, stepSchoolDay } from '../../data-access/school-days';

/**
 * ① Navigateur de jour et ② saut de date. Deux flèches qui vont de jour d'école en jour
 * d'école, la date en toutes lettres, sa position relative, le résumé du jour ; dessous, le
 * sélecteur natif de l'appareil et « Aujourd'hui ». Borné par la fenêtre rendue par le serveur.
 */
@Component({
  selector: 'app-day-navigator',
  imports: [PeriodNavigatorComponent],
  templateUrl: './day-navigator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayNavigatorComponent {
  readonly day = input.required<CivilDate>();
  readonly window = input.required<AssignmentWindow>();
  /** Résumé du jour, ex. « 2 épreuves » ou « Pas d'école ». */
  readonly summary = input.required<string>();
  readonly dayChange = output<CivilDate>();

  private readonly locale = inject(LOCALE_ID);
  private readonly navigator = viewChild.required(PeriodNavigatorComponent);

  private readonly date = computed(() => civilToDate(this.day()));
  protected readonly label = computed(() =>
    formatDate(this.date(), 'EEEE d MMMM y', this.locale, 'UTC'),
  );
  protected readonly previous = computed(() => stepSchoolDay(this.day(), -1, this.window()));
  protected readonly next = computed(() => stepSchoolDay(this.day(), 1, this.window()));
  protected readonly meta = computed(() => {
    const relative = relativeDay(this.day(), this.window().today);
    return relative ? `${relative} · ${this.summary()}` : this.summary();
  });
  protected readonly showToday = computed(
    () => this.day() !== this.window().today && inWindow(this.window().today, this.window()),
  );
  /** Annoncé à chaque changement de jour : « Vendredi 25 septembre, 2 épreuves ». */
  protected readonly announcement = computed(() => {
    const day = formatDate(this.date(), 'EEEE d MMMM', this.locale, 'UTC');
    return `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${this.summary()}`;
  });

  /** Rend le focus à la date une fois le nouveau jour affiché. */
  focusDate(): void {
    this.navigator().focusLabel();
  }

  /** Flèche : à la borne, elle se désactive et perd le focus ; on le rend à la date. */
  protected step(direction: 1 | -1): void {
    const target = direction === 1 ? this.next() : this.previous();
    if (!target) return;
    this.dayChange.emit(target);
    if (!stepSchoolDay(target, direction, this.window())) this.focusDate();
  }
}
