import { DatePipe, formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CivilDate, EvaluationSummary } from '../../../core/api/assignments.contract';
import { childLink, navEntry } from '../../../core/navigation/nav';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { statusView } from '../data-access/assignment-status';
import { countLabel, durationLabel } from '../data-access/formats';
import {
  civilToDate,
  isSchoolDay,
  nextBusyDay,
  openingDay,
  stepSchoolDay,
} from '../data-access/school-days';
import { AssignmentCardComponent } from '../ui/assignment-card/assignment-card.component';
import { DayNavigatorComponent } from '../ui/day-navigator/day-navigator.component';
import { AssessmentsFacade } from './data-access/assessments.facade';

/** Écart horizontal minimal d'un balayage, et dérive verticale tolérée. */
const SWIPE_MIN_X = 60;
const SWIPE_MAX_Y = 40;

/**
 * Mes évaluations : « qu'a-t-il à réviser, et pour quand ? ». Un jour à la fois ; s'ouvre sur
 * le prochain jour qui a une épreuve à venir. Le jour affiché vit dans l'URL (`?date=`), ce
 * qui permet à la fiche d'y ramener.
 */
@Component({
  selector: 'app-assessments-page',
  imports: [
    AssignmentCardComponent,
    DatePipe,
    DayNavigatorComponent,
    EmptyStateComponent,
    RouterLink,
    SkeletonComponent,
  ],
  templateUrl: './assessments.page.html',
  styleUrl: './assessments.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AssessmentsPage {
  readonly childId = input.required<string>();
  /** Jour demandé (`?date=YYYY-MM-DD`) ; ignoré s'il est invalide ou hors fenêtre. */
  readonly date = input<string>();

  private readonly facade = inject(AssessmentsFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly locale = inject(LOCALE_ID);

  protected readonly list = this.facade.listResource(() => this.childId());
  /** La liste chargée ; undefined pendant le chargement ou en erreur (value() lève alors). */
  protected readonly data = computed(() => (this.list.hasValue() ? this.list.value() : undefined));
  private readonly navigator = viewChild(DayNavigatorComponent);
  private touchStart: { x: number; y: number } | null = null;

  protected readonly day = computed(() => {
    const list = this.data();
    if (!list) return null;
    const upcoming = list.items
      .filter((item) => item.status === 'UPCOMING')
      .map((item) => item.date);
    return openingDay(list, this.date(), upcoming);
  });

  /**
   * Glissement de la liste à chaque changement de jour, quelle qu'en soit la source (flèche,
   * lien, URL) : sens déduit de l'ancien jour ; deux noms d'animation alternés pour la rejouer.
   */
  private readonly dayChange = linkedSignal<CivilDate | null, { backward: boolean; odd: boolean }>({
    source: this.day,
    computation: (day, previous) => ({
      backward: !!previous?.source && !!day && day < previous.source,
      odd: previous ? !previous.value.odd : false,
    }),
  });
  protected readonly dayAnimation = computed(() => {
    const { backward, odd } = this.dayChange();
    return `day-in-${backward ? 'backward' : 'forward'}-${odd ? 1 : 0}`;
  });

  /** Épreuves du jour, dans l'ordre du serveur (date, puis matière). */
  protected readonly items = computed(() => {
    const day = this.day();
    return this.data()?.items.filter((item) => item.date === day) ?? [];
  });

  protected readonly schoolDay = computed(() => {
    const list = this.data();
    const day = this.day();
    return !!list && !!day && isSchoolDay(day, list);
  });

  protected readonly summary = computed(() =>
    !this.schoolDay() && this.items().length === 0
      ? 'Pas d’école'
      : countLabel(this.items().length, 'épreuve', 'épreuves', 'Aucune épreuve'),
  );

  /** Prochain jour qui porte une épreuve, pour sortir d'un jour vide sans taper à l'aveugle. */
  protected readonly nextDay = computed(() => {
    const day = this.day();
    const list = this.data();
    return day && list
      ? nextBusyDay(
          day,
          list.items.map((item) => item.date),
        )
      : null;
  });

  protected cardLink(evaluationId: string): string[] {
    return [...childLink(this.childId(), navEntry('assessments').path), evaluationId];
  }

  protected cardWhen(item: EvaluationSummary): string {
    const day = formatDate(civilToDate(item.date), 'EEEE dd/MM', this.locale, 'UTC');
    const duration = durationLabel(item.durationMinutes);
    const when = `${day.charAt(0).toUpperCase()}${day.slice(1)}`;
    return duration ? `${when} · ${duration}` : when;
  }

  protected readonly statusView = statusView;

  protected nextDayDate(day: CivilDate): Date {
    return civilToDate(day);
  }

  protected selectDay(day: CivilDate): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { date: day },
      replaceUrl: true,
    });
  }

  /** Le lien du jour vide disparaît avec lui : le focus passe à la date du navigateur. */
  protected focusNavigator(): void {
    this.navigator()?.focusDate();
  }

  protected onTouchStart(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    this.touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  /** Balayage horizontal sur la liste : même effet que les flèches. */
  protected onTouchEnd(event: TouchEvent): void {
    const start = this.touchStart;
    const touch = event.changedTouches[0];
    const list = this.data();
    const day = this.day();
    this.touchStart = null;
    if (!start || !touch || !list || !day) return;
    const dx = touch.clientX - start.x;
    if (Math.abs(dx) < SWIPE_MIN_X || Math.abs(touch.clientY - start.y) > SWIPE_MAX_Y) return;
    const target = stepSchoolDay(day, dx < 0 ? 1 : -1, list);
    if (target) this.selectDay(target);
  }
}
