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
import { CivilDate, HomeworkSummary } from '../../../core/api/assignments.contract';
import { childLink, navEntry } from '../../../core/navigation/nav';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { statusView } from '../data-access/assignment-status';
import { deliveryLabel } from '../data-access/formats';
import { civilToDate, openingDay } from '../data-access/school-days';
import { AssignmentCardComponent } from '../ui/assignment-card/assignment-card.component';
import { DayListComponent, DayListLabels } from '../ui/day-list/day-list.component';
import { HomeworkFacade } from './data-access/homework.facade';

const LABELS: DayListLabels = {
  region: 'Devoirs du jour',
  one: 'devoir',
  many: 'devoirs',
  none: 'Aucun devoir',
  emptyDay: 'Aucun devoir à rendre ce jour',
  next: 'Prochain devoir',
};

/**
 * Mes devoirs : « qu'a-t-il à rendre, et pour quand ? ». Un jour à la fois, celui de
 * l'échéance (`dueDate`) ; s'ouvre sur le prochain jour qui a un devoir à rendre. Le jour
 * affiché vit dans l'URL (`?date=`), ce qui permet à la fiche d'y ramener.
 */
@Component({
  selector: 'app-homework-page',
  imports: [AssignmentCardComponent, DayListComponent, EmptyStateComponent, SkeletonComponent],
  templateUrl: './homework.page.html',
  styleUrl: './homework.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeworkPage {
  readonly childId = input.required<string>();
  /** Jour demandé (`?date=YYYY-MM-DD`) ; ignoré s'il est invalide ou hors fenêtre. */
  readonly date = input<string>();

  private readonly facade = inject(HomeworkFacade);
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
    const due = list.items.filter((item) => item.status === 'DUE').map((item) => item.dueDate);
    return openingDay(list, this.date(), due);
  });

  /** Devoirs du jour, dans l'ordre du serveur (échéance, puis matière). */
  protected readonly items = computed(() => {
    const day = this.day();
    return this.data()?.items.filter((item) => item.dueDate === day) ?? [];
  });

  protected readonly busyDays = computed(
    () => this.data()?.items.map((item) => item.dueDate) ?? [],
  );

  protected cardLink(evaluationId: string): string[] {
    return [...childLink(this.childId(), navEntry('homework').path), evaluationId];
  }

  /** « Mercredi 23/09 · avant 18:00 · en ligne » ; sans heure limite, la date seule. */
  protected cardWhen(item: HomeworkSummary): string {
    const day = formatDate(civilToDate(item.dueDate), 'EEEE dd/MM', this.locale, 'UTC');
    const parts = [`${day.charAt(0).toUpperCase()}${day.slice(1)}`];
    if (item.dueTime) parts.push(`avant ${item.dueTime}`);
    parts.push(deliveryLabel(item.deliveryMode).toLowerCase());
    return parts.join(' · ');
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
