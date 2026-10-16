import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GradeCard, GradeWeek } from '../../../core/api/grades.contract';
import { CivilDate, addDays, daysBetween } from '../../../shared/date/civil-date';
import { dayLabel } from '../../../shared/format/day-labels';
import { relativeWeek } from '../../../shared/format/relative-week';
import { WIDE_SCREEN, mediaQuery } from '../../../shared/layout/media-query';
import { latestValue } from '../../../shared/resource/latest-value';
import { EmptyPeriodComponent } from '../../../shared/ui/empty-period/empty-period.component';
import { LoadErrorComponent } from '../../../shared/ui/load-error/load-error.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { SwipePagerComponent } from '../../../shared/ui/swipe-pager/swipe-pager.component';
import { WeekBannerComponent } from '../../../shared/ui/week-banner/week-banner.component';
import { shortWeekLabel, weekLabel, weekSummary } from '../data-access/grade-formats';
import { evaluationLink, evaluationQueryParams } from '../data-access/grade-links';
import { GradesFacade } from '../data-access/grades.facade';
import { ResultCardComponent } from '../ui/result-card/result-card.component';

/**
 * Ma semaine : « qu'a-t-il eu cette semaine ? ». Les évaluations d'une semaine, groupées par
 * jour par le serveur, sans aucune moyenne. ① Le bandeau bleu des autres pages, au pas d'une
 * semaine, de la rentrée à la semaine en cours ; le résumé dessous. La semaine vit dans l'URL
 * (`?date=`) : la fiche y ramène, le changement d'enfant la garde. La semaine affichée reste à
 * l'écran pendant que la suivante arrive, plutôt qu'un squelette à chaque flèche.
 */
@Component({
  selector: 'app-grades-week-page',
  imports: [
    EmptyPeriodComponent,
    LoadErrorComponent,
    ResultCardComponent,
    SkeletonComponent,
    SwipePagerComponent,
    WeekBannerComponent,
  ],
  templateUrl: './grades-week.page.html',
  styleUrl: './grades-week.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GradesWeekPage {
  readonly childId = input.required<string>();
  /** Un jour de la semaine demandée (`?date=YYYY-MM-DD`) ; absent, la semaine en cours. */
  readonly date = input<string>();

  private readonly facade = inject(GradesFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly locale = inject(LOCALE_ID);
  private readonly banner = viewChild(WeekBannerComponent);

  protected readonly wide = mediaQuery(WIDE_SCREEN);
  protected readonly resource = this.facade.weekResource(() => ({
    childId: this.childId(),
    weekOf: this.date(),
  }));
  protected readonly week = latestValue(this.resource);
  protected readonly loading = computed(() => this.resource.isLoading());

  protected readonly label = computed(() => {
    const week = this.week();
    return week ? weekLabel(week.weekStart, week.weekEnd, this.locale) : '';
  });
  protected readonly shortLabel = computed(() => {
    const week = this.week();
    return week ? shortWeekLabel(week.weekStart, week.weekEnd, this.locale) : '';
  });
  protected readonly relative = computed(() => {
    const week = this.week();
    return relativeWeek(week ? Math.round(daysBetween(week.currentWeek, week.weekStart) / 7) : 0);
  });
  protected readonly summary = computed(() => {
    const week = this.week();
    return week ? weekSummary(week.summary) : '';
  });

  protected readonly days = computed(() =>
    (this.week()?.days ?? []).map((day) => ({
      ...day,
      label: dayLabel(day.date, this.locale),
    })),
  );
  protected readonly lastEvaluationLabel = computed(() => {
    const last = this.week()?.lastEvaluationDate;
    return last ? `Dernière évaluation : ${dayLabel(last, this.locale).toLowerCase()}` : null;
  });

  protected cardLink(item: GradeCard): string[] {
    return evaluationLink(this.childId(), item);
  }

  protected cardQueryParams(week: GradeWeek) {
    return evaluationQueryParams('grades-week', { date: week.weekStart });
  }

  protected selectWeek(date: CivilDate): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { date },
      replaceUrl: true,
    });
  }

  /** Flèche ou balayage : la semaine voisine, dans les bornes. */
  protected step(direction: 1 | -1, week: GradeWeek): void {
    const target = addDays(week.weekStart, 7 * direction);
    if (target >= week.firstWeek && target <= week.currentWeek) this.selectWeek(target);
  }

  /** Le lien de la semaine vide disparaît avec elle : le focus passe à l'intitulé du bandeau. */
  protected focusBanner(): void {
    this.banner()?.focusTitle();
  }
}
