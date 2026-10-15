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
import { CivilDate, addDays } from '../../../shared/date/civil-date';
import { EmptyPeriodComponent } from '../../../shared/ui/empty-period/empty-period.component';
import { LoadErrorComponent } from '../../../shared/ui/load-error/load-error.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { SwipePagerComponent } from '../../../shared/ui/swipe-pager/swipe-pager.component';
import { dayLabel } from '../../../shared/format/day-labels';
import { latestValue } from '../../../shared/resource/latest-value';
import { evaluationLink, evaluationQueryParams } from '../data-access/grade-links';
import { GradesFacade } from '../data-access/grades.facade';
import { ResultCardComponent } from '../ui/result-card/result-card.component';
import { WeekNavigatorComponent } from '../ui/week-navigator/week-navigator.component';

/**
 * Ma semaine : « qu'a-t-il eu cette semaine ? ». Les évaluations d'une semaine, groupées par
 * jour par le serveur, sans aucune moyenne. La semaine vit dans l'URL (`?date=`) : la fiche y ramène, le
 * changement d'enfant la garde. La semaine affichée reste à l'écran pendant que la suivante
 * arrive, plutôt qu'un squelette à chaque flèche.
 */
@Component({
  selector: 'app-grades-week-page',
  imports: [
    EmptyPeriodComponent,
    LoadErrorComponent,
    ResultCardComponent,
    SkeletonComponent,
    SwipePagerComponent,
    WeekNavigatorComponent,
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
  private readonly navigator = viewChild(WeekNavigatorComponent);

  protected readonly resource = this.facade.weekResource(() => ({
    childId: this.childId(),
    weekOf: this.date(),
  }));
  protected readonly week = latestValue(this.resource);
  protected readonly loading = computed(() => this.resource.isLoading());

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

  /** Balayage : même effet que les flèches, dans les bornes. */
  protected onSwipe(direction: 1 | -1, week: GradeWeek): void {
    const target = addDays(week.weekStart, 7 * direction);
    if (target >= week.firstWeek && target <= week.currentWeek) this.selectWeek(target);
  }

  /** Le lien de la semaine vide disparaît avec elle : le focus passe au navigateur. */
  protected focusNavigator(): void {
    this.navigator()?.focusLabel();
  }
}
