import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CivilDate, EvaluationSummary } from '../../../core/api/assignments.contract';
import { childLink, navEntry } from '../../../core/navigation/nav';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { statusView } from '../data-access/assignment-status';
import { durationLabel } from '../data-access/formats';
import { civilToDate, openingDay } from '../data-access/school-days';
import { AssignmentCardComponent } from '../ui/assignment-card/assignment-card.component';
import { DayListComponent, DayListLabels } from '../ui/day-list/day-list.component';
import { AssessmentsFacade } from './data-access/assessments.facade';

const LABELS: DayListLabels = {
  region: 'Épreuves du jour',
  one: 'épreuve',
  many: 'épreuves',
  none: 'Aucune épreuve',
  emptyDay: 'Aucune épreuve ce jour',
  next: 'Prochaine épreuve',
};

/**
 * Mes évaluations : « qu'a-t-il à réviser, et pour quand ? ». Un jour à la fois ; s'ouvre sur
 * le prochain jour qui a une épreuve à venir. Le jour affiché vit dans l'URL (`?date=`), ce
 * qui permet à la fiche d'y ramener.
 */
@Component({
  selector: 'app-assessments-page',
  imports: [AssignmentCardComponent, DayListComponent, EmptyStateComponent, SkeletonComponent],
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

  protected readonly labels = LABELS;
  protected readonly list = this.facade.listResource(() => this.childId());
  /** La liste chargée ; undefined pendant le chargement ou en erreur (value() lève alors). */
  protected readonly data = computed(() => (this.list.hasValue() ? this.list.value() : undefined));

  protected readonly day = computed(() => {
    const list = this.data();
    if (!list) return null;
    const upcoming = list.items
      .filter((item) => item.status === 'UPCOMING')
      .map((item) => item.date);
    return openingDay(list, this.date(), upcoming);
  });

  /** Épreuves du jour, dans l'ordre du serveur (date, puis matière). */
  protected readonly items = computed(() => {
    const day = this.day();
    return this.data()?.items.filter((item) => item.date === day) ?? [];
  });

  protected readonly busyDays = computed(() => this.data()?.items.map((item) => item.date) ?? []);

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

  protected selectDay(day: CivilDate): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { date: day },
      replaceUrl: true,
    });
  }
}
