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
import { CivilDate, CivilMonth, addMonths } from '../../../shared/date/civil-date';
import { latestValue } from '../../../shared/resource/latest-value';
import { EmptyPeriodComponent } from '../../../shared/ui/empty-period/empty-period.component';
import { LoadErrorComponent } from '../../../shared/ui/load-error/load-error.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { SwipePagerComponent } from '../../../shared/ui/swipe-pager/swipe-pager.component';
import {
  AbsenceJustificationStore,
  JustificationDraft,
} from '../data-access/absence-justification.store';
import { monthView } from '../data-access/attendance-view';
import { ConductFacade } from '../data-access/conduct.facade';
import { AbsenceListComponent } from '../ui/absence-list/absence-list.component';
import { AttendanceHeaderComponent } from '../ui/attendance-header/attendance-header.component';
import { DaySheetComponent } from '../ui/day-sheet/day-sheet.component';
import { JustificationSheetComponent } from '../ui/justification-sheet/justification-sheet.component';
import { MonthCalendarComponent } from '../ui/month-calendar/month-calendar.component';
import { MonthNavigatorComponent } from '../ui/month-navigator/month-navigator.component';
import { PendingAbsencesComponent } from '../ui/pending-absences/pending-absences.component';

/**
 * Ma présence : « il était malade », « c'est fréquent ? ». Ce qui attend le parent en haut
 * (②), puis le taux depuis la rentrée (①), le mois (③) et ses absences et retards (⑤). Toute
 * l'année est lue en un appel ; le mois vit dans l'URL (`?month=`), le jour ciblé aussi
 * (`?date=`, depuis Ma discipline), sa fiche s'ouvre alors d'elle-même.
 */
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
    SkeletonComponent,
    SwipePagerComponent,
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
