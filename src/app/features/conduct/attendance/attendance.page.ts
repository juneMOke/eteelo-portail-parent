import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  LOCALE_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CivilDate, CivilMonth, addDays, addMonths } from '../../../shared/date/civil-date';
import { WIDE_SCREEN, mediaQuery } from '../../../shared/layout/media-query';
import { latestValue } from '../../../shared/resource/latest-value';
import { EmptyPeriodComponent } from '../../../shared/ui/empty-period/empty-period.component';
import { LoadErrorComponent } from '../../../shared/ui/load-error/load-error.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { SwipePagerComponent } from '../../../shared/ui/swipe-pager/swipe-pager.component';
import { WeekBannerComponent } from '../../../shared/ui/week-banner/week-banner.component';
import {
  AbsenceJustificationStore,
  JustificationDraft,
} from '../data-access/absence-justification.store';
import { monthView, weekView } from '../data-access/attendance-view';
import { ConductFacade } from '../data-access/conduct.facade';
import { AbsenceListComponent } from '../ui/absence-list/absence-list.component';
import { AttendanceHeaderComponent } from '../ui/attendance-header/attendance-header.component';
import { DaySheetComponent } from '../ui/day-sheet/day-sheet.component';
import { JustificationSheetComponent } from '../ui/justification-sheet/justification-sheet.component';
import { MonthCalendarComponent } from '../ui/month-calendar/month-calendar.component';
import { MonthNavigatorComponent } from '../ui/month-navigator/month-navigator.component';
import { PendingAbsencesComponent } from '../ui/pending-absences/pending-absences.component';
import { WeekDaysComponent } from '../ui/week-days/week-days.component';
import { WeekIndicatorsComponent } from '../ui/week-indicators/week-indicators.component';

/**
 * Ma présence : « il était malade », « c'est fréquent ? ». Ce qui attend le parent en haut
 * (②), puis le taux depuis la rentrée (①), deux échelles titrées (spec 06 v2) : « La semaine »
 * (⑪, ses jours et ses indicateurs) et « Le mois » (③ et ses absences et retards ⑤). Toute
 * l'année est lue en un appel, seuls les indicateurs de la semaine ont le leur. La semaine
 * (`?week=`) et le mois (`?month=`) vivent dans l'URL, le jour ciblé aussi (`?date=`, depuis
 * Ma discipline) : sa fiche s'ouvre alors d'elle-même.
 */
import { StaleNoticeComponent } from '../../../shared/ui/stale-notice/stale-notice.component';
import { RefreshHighlightDirective } from '../../../shared/resource/refresh-highlight.directive';
@Component({
  selector: 'app-attendance-page',
  imports: [
    AbsenceListComponent,
    AttendanceHeaderComponent,
    DaySheetComponent,
    EmptyPeriodComponent,
    JustificationSheetComponent,
    LoadErrorComponent,
    MonthCalendarComponent,
    MonthNavigatorComponent,
    PendingAbsencesComponent,
    RefreshHighlightDirective,
    SkeletonComponent,
    StaleNoticeComponent,
    SwipePagerComponent,
    WeekBannerComponent,
    WeekDaysComponent,
    WeekIndicatorsComponent,
  ],
  templateUrl: './attendance.page.html',
  styleUrl: './attendance.page.css',
  providers: [AbsenceJustificationStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AttendancePage {
  readonly childId = input.required<string>();
  /** Mois affiché (`?month=YYYY-MM`) ; absent, le mois du jour ciblé ou le mois en cours. */
  readonly month = input<string>();
  /** Un jour de la semaine affichée (`?week=YYYY-MM-DD`) ; absent, celle du jour ciblé ou l'actuelle. */
  readonly week = input<string>();
  /** Jour dont la fiche s'ouvre à l'arrivée (`?date=YYYY-MM-DD`). */
  readonly date = input<string>();

  private readonly facade = inject(ConductFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly locale = inject(LOCALE_ID);
  private readonly injector = inject(Injector);
  private readonly daySheet = viewChild(DaySheetComponent);
  private readonly justificationSheet = viewChild(JustificationSheetComponent);

  protected readonly justification = inject(AbsenceJustificationStore);
  protected readonly resource = this.facade.attendanceResource(this.childId);
  protected readonly attendance = latestValue(this.resource);

  protected readonly wide = mediaQuery(WIDE_SCREEN);
  protected readonly weekView = computed(() => {
    const attendance = this.attendance();
    return attendance ? weekView(attendance, this.week(), this.date(), this.locale) : null;
  });
  /** Une nouvelle requête seulement quand la plage change, pas à chaque relecture de l'année. */
  private readonly weekRequest = computed(
    () => {
      const range = this.weekView()?.range;
      return range ? { childId: this.childId(), ...range } : undefined;
    },
    { equal: (a, b) => a?.childId === b?.childId && a?.from === b?.from && a?.to === b?.to },
  );
  protected readonly weekResource = this.facade.attendanceWeekResource(this.weekRequest);
  private readonly weekAttendance = latestValue(this.weekResource);
  protected readonly weekSummary = computed(() => this.weekAttendance()?.summary);

  protected readonly view = computed(() => {
    const attendance = this.attendance();
    return attendance ? monthView(attendance, this.month(), this.date(), this.locale) : null;
  });
  /** Jour de la fiche ouverte. */
  protected readonly openDate = signal<CivilDate | null>(null);
  protected readonly openDay = computed(() => {
    const date = this.openDate();
    return date ? this.view()?.byDate.get(date) : undefined;
  });

  /** Jour ciblé déjà montré : une relecture de la présence ne rouvre pas sa fiche. */
  private shownTarget: string | null = null;

  constructor() {
    // Jour ciblé par l'URL : sa fiche s'ouvre une fois la page affichée (effet de bord seul).
    effect(() => {
      const date = this.date();
      if (!date || !this.view() || date === this.shownTarget) return;
      this.shownTarget = date;
      untracked(() => afterNextRender(() => this.showDay(date), { injector: this.injector }));
    });
  }

  protected selectMonth(month: CivilMonth): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { month, date: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected selectWeek(week: CivilDate): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { week, date: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** Flèche ou balayage : la semaine voisine, dans les bornes. */
  protected stepWeek(direction: 1 | -1): void {
    const view = this.weekView();
    if (!view) return;
    const target = addDays(view.monday, 7 * direction);
    if (target >= view.bounds.first && target <= view.bounds.last) this.selectWeek(target);
  }

  /** Balayage : même effet que les flèches, dans les bornes. */
  protected onSwipe(direction: 1 | -1): void {
    const view = this.view();
    if (!view) return;
    const target = addMonths(view.month, direction);
    if (target >= view.bounds.first && target <= view.bounds.last) this.selectMonth(target);
  }

  protected showDay(date: CivilDate): void {
    this.openDate.set(date);
    this.daySheet()?.open();
  }

  protected startJustification(date: CivilDate): void {
    this.daySheet()?.close();
    this.justification.clearFailure();
    this.justificationSheet()?.open(date);
  }

  protected async sendJustification(date: CivilDate, draft: JustificationDraft): Promise<void> {
    const sent = await this.justification.submit(this.childId(), date, draft);
    if (sent) this.justificationSheet()?.done();
    // Reçue ou refusée pour de bon : l'état du jour se relit au serveur.
    if (sent || this.justification.failure()?.retryable === false) this.resource.reload();
  }
}
