import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { ReportCard } from '../../../../core/api/grades.contract';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { evolutionLabel, percentLabel, rankLabel } from '../../data-access/grade-formats';
import { AverageComponent } from '../average/average.component';

/**
 * ⑥ En-tête de moyenne générale, seul endroit où elle figure. Il dit d'où vient le chiffre avant
 * de le donner : « Officiel · publié le 26/09 » (tel que publié par l'école, jamais recalculé)
 * ou « Provisoire » (calculé par le serveur sur les notes publiées, sans rang).
 */
@Component({
  selector: 'app-average-header',
  imports: [AverageComponent, BadgeComponent],
  templateUrl: './average-header.component.html',
  styleUrl: './average-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AverageHeaderComponent {
  readonly report = input.required<ReportCard>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly official = computed(() => this.report().status === 'OFFICIAL');

  /** « Officiel · publié le 26/09 », « Provisoire ». */
  protected readonly status = computed(() => {
    const { publishedAt } = this.report();
    if (!this.official()) return 'Provisoire';
    return publishedAt ? `Officiel · publié le ${this.day(publishedAt, 'dd/MM')}` : 'Officiel';
  });

  /** Lu avant le chiffre : « Bulletin officiel, publié le 19 décembre. Moyenne générale 58,4 %. » */
  protected readonly spoken = computed(() => {
    const { publishedAt, average } = this.report();
    const origin = this.official()
      ? `Bulletin officiel${publishedAt ? `, publié le ${this.day(publishedAt, 'd MMMM')}` : ''}.`
      : 'Moyenne provisoire.';
    const value = average ? percentLabel(average.percent, this.locale) : 'pas encore de note';
    return `${origin} Moyenne générale ${value}.`;
  });

  protected readonly evolution = computed(() => {
    const evolution = this.report().evolution;
    return evolution ? evolutionLabel(evolution, this.locale) : null;
  });
  protected readonly rank = computed(() => {
    const rank = this.report().rank;
    return rank ? rankLabel(rank) : null;
  });

  private day(instant: string, format: string): string {
    return formatDate(instant, format, this.locale);
  }
}
