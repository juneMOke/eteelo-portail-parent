import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { HomeworkSummary } from '../../../core/api/assignments.contract';
import { childLink, navEntry } from '../../../core/navigation/nav';
import { dayLabel } from '../../../shared/format/day-labels';
import { hourLabel } from '../../../shared/format/time-labels';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { statusView } from '../data-access/assignment-status';
import { nearDay } from '../data-access/school-week';
import { WeekBoardLabels, WeekCard } from '../data-access/week-board';
import { WeekBoardComponent } from '../ui/week-board/week-board.component';
import { HomeworkFacade } from './data-access/homework.facade';

const LABELS: WeekBoardLabels = {
  region: 'Devoirs de la semaine',
  one: 'devoir',
  many: 'devoirs',
  none: 'aucun devoir',
  all: 'Tous',
  statuses: [
    { id: 'DUE', label: 'À rendre', tone: 'pending', empty: 'Aucun devoir à rendre' },
    { id: 'SUBMITTED', label: 'Rendus', tone: 'info', empty: 'Aucun devoir rendu' },
    {
      id: 'AWAITING_GRADE',
      label: 'En attente de correction',
      tone: 'info',
      empty: 'Aucun devoir en attente de correction',
    },
    { id: 'GRADED', label: 'Corrigés', tone: 'success', empty: 'Aucun devoir corrigé' },
    { id: 'MISSED', label: 'Non rendus', tone: 'alert', empty: 'Aucun devoir non rendu' },
  ],
  emptyWeek: 'Aucun devoir cette semaine',
  emptyDay: 'Aucun devoir à rendre ce jour',
  emptyColumn: 'Rien à rendre',
};

/**
 * Mes devoirs : « qu'a-t-il à rendre, et pour quand ? ». Une semaine à la fois ; chaque devoir
 * se range au jour de son échéance (`dueDate`). Semaine, filtres et vue vivent dans l'URL.
 */
@Component({
  selector: 'app-homework-page',
  imports: [EmptyStateComponent, SkeletonComponent, WeekBoardComponent],
  templateUrl: './homework.page.html',
  styleUrl: './homework.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeworkPage {
  readonly childId = input.required<string>();
  readonly week = input<string>();
  readonly day = input<string>();
  readonly status = input<string>();
  readonly view = input<string>();
  /** Jour d'un lien venu d'ailleurs (notification, autre page) : ouvre sa semaine. */
  readonly date = input<string>();

  private readonly facade = inject(HomeworkFacade);
  private readonly locale = inject(LOCALE_ID);

  protected readonly labels = LABELS;
  protected readonly list = this.facade.listResource(() => this.childId());
  /** La liste chargée ; undefined pendant le chargement ou en erreur (value() lève alors). */
  protected readonly data = computed(() => (this.list.hasValue() ? this.list.value() : undefined));
  protected readonly listLink = computed(() =>
    childLink(this.childId(), navEntry('homework').path),
  );

  protected readonly cards = computed<WeekCard[]>(() => {
    const list = this.data();
    return list ? list.items.map((item) => this.card(item, list.today)) : [];
  });

  /** « Mercredi 23/09 avant 18 h » ; sans heure limite, la date seule. */
  private card(item: HomeworkSummary, today: string): WeekCard {
    const before = item.dueTime ? `avant ${hourLabel(item.dueTime)}` : null;
    const near = nearDay(item.dueDate, today);
    const urgent =
      item.status === 'DUE' && (near === 'aujourd’hui' || near === 'demain')
        ? [`À rendre ${near}`, before].filter(Boolean).join(' ')
        : null;
    return {
      id: item.evaluationId,
      day: item.dueDate,
      status: item.status,
      view: statusView(item.status),
      heading: item.title,
      when: [dayLabel(item.dueDate, this.locale), before].filter(Boolean).join(' '),
      compactWhen: before,
      detail: item.teacherLabel,
      urgent,
      grade:
        item.status === 'GRADED' && item.points !== null
          ? { points: item.points, maxPoints: item.maxPoints }
          : null,
    };
  }
}
