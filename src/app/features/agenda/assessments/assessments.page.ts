import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { EvaluationSummary } from '../../../core/api/assignments.contract';
import { childLink, navEntry } from '../../../core/navigation/nav';
import { dayLabel } from '../../../shared/format/day-labels';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { StaleNoticeComponent } from '../../../shared/ui/stale-notice/stale-notice.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { statusView } from '../data-access/assignment-status';
import { durationLabel } from '../data-access/formats';
import { nearDay } from '../data-access/school-week';
import { WeekBoardLabels, WeekCard } from '../data-access/week-board';
import { WeekBoardComponent } from '../ui/week-board/week-board.component';
import { AssessmentsFacade } from './data-access/assessments.facade';

const LABELS: WeekBoardLabels = {
  region: 'Épreuves de la semaine',
  one: 'épreuve',
  many: 'épreuves',
  none: 'aucune épreuve',
  all: 'Toutes',
  statuses: [
    { id: 'UPCOMING', label: 'À venir', tone: 'pending', empty: 'Aucune évaluation à venir' },
    {
      id: 'AWAITING_GRADE',
      label: 'En attente de correction',
      tone: 'info',
      empty: 'Aucune évaluation en attente de correction',
    },
    { id: 'GRADED', label: 'Corrigées', tone: 'success', empty: 'Aucune évaluation corrigée' },
    { id: 'ABSENT', label: 'Absences', tone: 'alert', empty: 'Aucune absence à une épreuve' },
  ],
  emptyWeek: 'Aucune évaluation cette semaine',
  emptyDay: 'Aucune épreuve ce jour',
  emptyColumn: 'Rien de prévu',
};

/**
 * Mes évaluations : « qu'a-t-il à réviser, et pour quand ? ». Une semaine à la fois ; chaque
 * épreuve se range au jour où elle est passée. Semaine, filtres et vue vivent dans l'URL.
 */
@Component({
  selector: 'app-assessments-page',
  imports: [EmptyStateComponent, SkeletonComponent, StaleNoticeComponent, WeekBoardComponent],
  templateUrl: './assessments.page.html',
  styleUrl: './assessments.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AssessmentsPage {
  readonly childId = input.required<string>();
  readonly week = input<string>();
  readonly day = input<string>();
  readonly status = input<string>();
  readonly view = input<string>();
  /** Jour d'un lien venu d'ailleurs (notification, Mes notes) : ouvre sa semaine. */
  readonly date = input<string>();

  private readonly facade = inject(AssessmentsFacade);
  private readonly locale = inject(LOCALE_ID);

  protected readonly labels = LABELS;
  protected readonly list = this.facade.listResource(() => this.childId());
  /** La liste chargée ; undefined pendant le chargement ou en erreur (value() lève alors). */
  protected readonly data = computed(() => (this.list.hasValue() ? this.list.value() : undefined));
  protected readonly listLink = computed(() =>
    childLink(this.childId(), navEntry('assessments').path),
  );

  protected readonly cards = computed<WeekCard[]>(() => {
    const list = this.data();
    return list ? list.items.map((item) => this.card(item, list.today)) : [];
  });

  /** « Jeudi 24/09 · 2 h » ; sans durée connue, la date seule. */
  private card(item: EvaluationSummary, today: string): WeekCard {
    const duration = durationLabel(item.durationMinutes);
    const near = nearDay(item.date, today);
    return {
      id: item.evaluationId,
      day: item.date,
      status: item.status,
      view: statusView(item.status),
      heading: item.title,
      when: [dayLabel(item.date, this.locale), duration].filter(Boolean).join(' · '),
      compactWhen: duration,
      detail: item.teacherLabel,
      urgent:
        item.status === 'UPCOMING' && (near === 'aujourd’hui' || near === 'demain')
          ? `Épreuve ${near}`
          : null,
      grade:
        item.status === 'GRADED' && item.points !== null
          ? { points: item.points, maxPoints: item.maxPoints }
          : null,
    };
  }
}
