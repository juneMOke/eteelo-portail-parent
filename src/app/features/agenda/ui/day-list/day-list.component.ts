import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AssignmentWindow, CivilDate } from '../../../../core/api/assignments.contract';
import { countLabel } from '../../data-access/formats';
import { civilToDate, isSchoolDay, nextBusyDay, stepSchoolDay } from '../../data-access/school-days';
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

/** Écart horizontal minimal d'un balayage, et dérive verticale tolérée. */
const SWIPE_MIN_X = 60;
const SWIPE_MAX_Y = 40;

/**
 * Squelette commun de Mes devoirs et Mes évaluations : ① le navigateur de jour, puis ③ les
 * cartes du jour (projetées par la page) ou ④ le jour vide, qui mène au prochain jour occupé.
 * Un balayage horizontal vaut une flèche ; la liste glisse dans le sens du changement de jour.
 */
@Component({
  selector: 'app-day-list',
  imports: [DatePipe, DayNavigatorComponent, RouterLink],
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
  private touchStart: { x: number; y: number } | null = null;

  /**
   * Glissement de la liste à chaque changement de jour, quelle qu'en soit la source (flèche,
   * lien, URL) : sens déduit de l'ancien jour ; deux noms d'animation alternés pour la rejouer.
   */
  private readonly dayChangeMotion = linkedSignal<
    CivilDate,
    { backward: boolean; odd: boolean }
  >({
    source: this.day,
    computation: (day, previous) => ({
      backward: !!previous && day < previous.source,
      odd: previous ? !previous.value.odd : false,
    }),
  });
  protected readonly dayAnimation = computed(() => {
    const { backward, odd } = this.dayChangeMotion();
    return `day-in-${backward ? 'backward' : 'forward'}-${odd ? 1 : 0}`;
  });

  protected readonly schoolDay = computed(() => isSchoolDay(this.day(), this.window()));

  protected readonly summary = computed(() => {
    const { one, many, none } = this.labels();
    return !this.schoolDay() && this.count() === 0
      ? 'Pas d’école'
      : countLabel(this.count(), one, many, none);
  });

  /** Prochain jour occupé, pour sortir d'un jour vide sans taper à l'aveugle. */
  protected readonly nextDay = computed(() => nextBusyDay(this.day(), this.busyDays()));

  protected nextDayDate(day: CivilDate): Date {
    return civilToDate(day);
  }

  protected select(day: CivilDate): void {
    this.dayChange.emit(day);
  }

  /** Le lien du jour vide disparaît avec lui : le focus passe à la date du navigateur. */
  protected focusNavigator(): void {
    this.navigator().focusDate();
  }

  protected onTouchStart(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    this.touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  /** Balayage horizontal sur la liste : même effet que les flèches. */
  protected onTouchEnd(event: TouchEvent): void {
    const start = this.touchStart;
    const touch = event.changedTouches[0];
    this.touchStart = null;
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    if (Math.abs(dx) < SWIPE_MIN_X || Math.abs(touch.clientY - start.y) > SWIPE_MAX_Y) return;
    const target = stepSchoolDay(this.day(), dx < 0 ? 1 : -1, this.window());
    if (target) this.select(target);
  }
}
