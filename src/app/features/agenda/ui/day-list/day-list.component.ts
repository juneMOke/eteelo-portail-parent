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
import { EmptyPeriodComponent } from '../../../../shared/ui/empty-period/empty-period.component';
import { SwipePagerComponent } from '../../../../shared/ui/swipe-pager/swipe-pager.component';
import { countLabel } from '../../data-access/formats';
import { isSchoolDay, nextBusyDay, stepSchoolDay } from '../../data-access/school-days';
import { DayNavigatorComponent } from '../day-navigator/day-navigator.component';

/** Textes d'une liste par jour : seuls les mots changent entre devoirs et évaluations. */
export interface DayListLabels {
  /** Nom de la région des cartes, ex. « Épreuves du jour ». */
  readonly region: string;
  /** Un élément, plusieurs, aucun : « 1 épreuve », « 3 épreuves », « Aucune épreuve ». */
  readonly one: string;
  readonly many: string;
  readonly none: string;
  /** Titre du jour vide, ex. « Aucune épreuve ce jour ». */
  readonly emptyDay: string;
  /** Lien vers le prochain jour occupé, ex. « Prochaine épreuve ». */
  readonly next: string;
}

/**
 * Squelette commun de Mes devoirs et Mes évaluations : ① le navigateur de jour, puis ③ les
 * cartes du jour (projetées par la page) ou ④ le jour vide, qui mène au prochain jour occupé.
 * Un balayage horizontal vaut une flèche ; la liste glisse dans le sens du changement de jour.
 */
@Component({
  selector: 'app-day-list',
  imports: [DayNavigatorComponent, EmptyPeriodComponent, SwipePagerComponent],
  templateUrl: './day-list.component.html',
  styleUrl: './day-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayListComponent {
  readonly day = input.required<CivilDate>();
  readonly window = input.required<AssignmentWindow>();
  /** Nombre d'éléments du jour affiché. */
  readonly count = input.required<number>();
  /** Jours de toute la fenêtre qui portent au moins un élément. */
  readonly busyDays = input.required<readonly CivilDate[]>();
  readonly labels = input.required<DayListLabels>();
  readonly dayChange = output<CivilDate>();

  private readonly navigator = viewChild.required(DayNavigatorComponent);
  private readonly locale = inject(LOCALE_ID);

  protected readonly schoolDay = computed(() => isSchoolDay(this.day(), this.window()));

  protected readonly summary = computed(() => {
    const { one, many, none } = this.labels();
    return !this.schoolDay() && this.count() === 0
      ? 'Pas d’école'
      : countLabel(this.count(), one, many, none);
  });

  /** Prochain jour occupé, pour sortir d'un jour vide sans taper à l'aveugle. */
  protected readonly nextDay = computed(() => nextBusyDay(this.day(), this.busyDays()));

  protected readonly nextDayLabel = computed(() => {
    const next = this.nextDay();
    if (!next) return null;
    return `${this.labels().next} : ${formatDate(civilToDate(next), 'EEEE dd/MM', this.locale, 'UTC')}`;
  });

  protected select(day: CivilDate): void {
    this.dayChange.emit(day);
  }

  /** Le lien du jour vide disparaît avec lui : le focus passe à la date du navigateur. */
  protected focusNavigator(): void {
    this.navigator().focusDate();
  }

  /** Balayage horizontal sur la liste : même effet que les flèches. */
  protected onSwipe(direction: 1 | -1): void {
    const target = stepSchoolDay(this.day(), direction, this.window());
    if (target) this.select(target);
  }
}
