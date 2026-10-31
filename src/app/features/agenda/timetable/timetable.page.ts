import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { CivilDate, isCivilDate, mondayOf } from '../../../shared/date/civil-date';
import { weekLabel } from '../../../shared/format/week-labels';
import { WIDE_SCREEN, mediaQuery } from '../../../shared/layout/media-query';
import { latestValue } from '../../../shared/resource/latest-value';
import { LoadErrorComponent } from '../../../shared/ui/load-error/load-error.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { StaleNoticeComponent } from '../../../shared/ui/stale-notice/stale-notice.component';
import { SwipePagerComponent } from '../../../shared/ui/swipe-pager/swipe-pager.component';
import { schoolClock } from './data-access/school-clock';
import { TimetableFacade } from './data-access/timetable.facade';
import {
  currentWeekStart,
  dayTitle,
  daySummary,
  openingDay,
  schoolInstant,
  shortDayLabel,
  shownDay,
  stepDay,
  stepWeek,
  stripDay,
  weekSummary,
} from './data-access/timetable-view';
import { DayScheduleComponent } from './ui/day-schedule/day-schedule.component';
import {
  StripDay,
  TimetableBannerComponent,
  TimetableView,
} from './ui/timetable-banner/timetable-banner.component';
import { WeekScheduleComponent } from './ui/week-schedule/week-schedule.component';

/**
 * Mon emploi du temps : « quel cours a-t-il, et où ? ». La journée heure par heure, et au grand
 * écran la semaine en colonnes. Le jour affiché (`?date=`) et la vue (`?view=week`) vivent dans
 * l'URL : la fiche d'épreuve y ramène, le changement d'enfant les garde. Sans jour, la page
 * s'ouvre sur aujourd'hui, ou sur le prochain jour d'école une fois les cours finis ; `?week=`,
 * la semaine venue de Mes devoirs ou Mes évaluations, ouvre son jour d'ouverture dans cette
 * semaine.
 */
@Component({
  selector: 'app-timetable-page',
  imports: [
    DayScheduleComponent,
    LoadErrorComponent,
    SkeletonComponent,
    StaleNoticeComponent,
    SwipePagerComponent,
    TimetableBannerComponent,
    WeekScheduleComponent,
  ],
  templateUrl: './timetable.page.html',
  styleUrl: './timetable.page.css',
  host: { '[class.week-view]': 'shownView() === "week"' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TimetablePage {
  readonly childId = input.required<string>();
  /** Le jour affiché ; absent, le jour d'ouverture. */
  readonly date = input<string>();
  /** La semaine de la page quittée (lundi) ; un `?date=` l'emporte. */
  readonly week = input<string>();
  /** `week` pour la vue semaine, au grand écran seulement. */
  readonly view = input<string>();

  private readonly facade = inject(TimetableFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly locale = inject(LOCALE_ID);

  protected readonly wide = mediaQuery(WIDE_SCREEN);
  private readonly requested = computed(() => {
    const date = this.date();
    return isCivilDate(date) ? date : undefined;
  });
  private readonly requestedWeek = computed(() => {
    const week = this.week();
    return isCivilDate(week) ? mondayOf(week) : undefined;
  });
  protected readonly resource = this.facade.weekResource(() => {
    const requested = this.requested();
    return {
      childId: this.childId(),
      week: requested ? mondayOf(requested) : this.requestedWeek(),
    };
  });
  protected readonly timetable = latestValue(this.resource);
  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly now = schoolClock(() => this.timetable());

  /** Un choix « Semaine » n'est pas reporté au téléphone. */
  protected readonly shownView = computed<TimetableView>(() =>
    this.wide() && this.view() === 'week' ? 'week' : 'day',
  );

  /** Figé à la réception : la page ne change pas de jour sous les yeux du parent. */
  private readonly opening = computed(() => {
    const week = this.timetable();
    if (!week || this.requested()) return null;
    return openingDay(week, schoolInstant(week.serverTime, week.timeZone));
  });
  protected readonly day = computed(() => {
    const week = this.timetable();
    return week ? shownDay(week, this.requested(), this.opening()) : undefined;
  });

  protected readonly title = computed(() => {
    const week = this.timetable();
    const day = this.day();
    if (!week || !day) return '';
    return this.shownView() === 'week'
      ? weekLabel(week.weekStart, week.days.at(-1)?.date ?? week.weekStart, this.locale)
      : dayTitle(day.date, this.locale);
  });
  protected readonly summary = computed(() => {
    const week = this.timetable();
    const day = this.day();
    if (!week || !day) return '';
    return this.shownView() === 'week' ? weekSummary(week) : daySummary(day, week.today);
  });

  protected readonly hasPrevious = computed(() => this.target(-1) !== null);
  protected readonly hasNext = computed(() => this.target(1) !== null);

  protected readonly currentLabel = computed(() => {
    const week = this.timetable();
    const day = this.day();
    if (!week || !day) return null;
    if (this.shownView() === 'week') {
      return week.weekStart === currentWeekStart(week) ? null : 'Revenir à cette semaine';
    }
    return (this.requested() ?? this.requestedWeek()) && day.date !== week.today
      ? 'Revenir à aujourd’hui'
      : null;
  });

  protected readonly strip = computed<StripDay[]>(() => {
    const week = this.timetable();
    const shown = this.day();
    if (!week || !shown) return [];
    return week.days.map((day) => ({
      date: day.date,
      ...stripDay(day.date, this.locale),
      spoken: dayTitle(day.date, this.locale),
      selected: day.date === shown.date,
      today: day.date === week.today,
    }));
  });

  /** Nouvel horaire publié (H5) : tant que sa prise d'effet est à venir. */
  protected readonly newTimetable = computed(() => {
    const week = this.timetable();
    const from = week?.newTimetableFrom;
    return week && from && from > week.today
      ? `Nouvel horaire à partir du ${shortDayLabel(from, this.locale)}.`
      : null;
  });

  protected readonly position = computed(() =>
    this.shownView() === 'week' ? (this.timetable()?.weekStart ?? '') : (this.day()?.date ?? ''),
  );

  /** Jour ou semaine voisine, selon la vue ; null à la borne. */
  private target(direction: 1 | -1): CivilDate | null {
    const week = this.timetable();
    const day = this.day();
    if (!week || !day) return null;
    return this.shownView() === 'week'
      ? stepWeek(week, direction)
      : stepDay(week, day.date, direction);
  }

  protected step(direction: 1 | -1): void {
    const target = this.target(direction);
    if (target) this.select(target);
  }

  protected select(date: CivilDate | null): void {
    this.navigate({ date, week: null });
  }

  protected changeView(view: TimetableView): void {
    this.navigate({ view: view === 'week' ? 'week' : null });
  }

  private navigate(queryParams: Params): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
