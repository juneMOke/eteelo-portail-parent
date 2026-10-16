import { formatDate, formatNumber } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { GradeCard } from '../../../../core/api/grades.contract';
import { spokenDay } from '../../../../shared/format/day-labels';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { capitalized, pointsLabel, shortDayLabel } from '../../data-access/grade-formats';
import { displayedScore, gradeStateView } from '../../data-access/grade-state';
import { subjectTone } from '../../data-access/subject-tone';

/**
 * ② Carte de résultat de Ma semaine : ce qui a été évalué, comment ça s'est passé, puis la fiche.
 * En-tête (pastille de matière, puis le titre tel que l'école l'a saisi), note à droite sur sa jauge, frise des
 * dates, notions en étiquettes et statut en pied. Filet gauche au ton de l'état ; toute la
 * carte ouvre la fiche.
 */
@Component({
  selector: 'app-result-card',
  imports: [BadgeComponent, IconComponent, RouterLink],
  templateUrl: './result-card.component.html',
  styleUrl: './result-card.component.css',
  host: {
    '[style.--tone]': "'var(--color-tone-' + state().tone + ')'",
    '[style.--subject]': 'subject().color',
    '[style.--subject-soft]': 'subject().soft',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultCardComponent {
  readonly evaluation = input.required<GradeCard>();
  readonly link = input.required<readonly string[]>();
  readonly queryParams = input<Params>({});

  private readonly locale = inject(LOCALE_ID);

  protected readonly state = computed(() => gradeStateView(this.evaluation().state));
  protected readonly subject = computed(() => subjectTone(this.evaluation().subjectCode));
  protected readonly topic = computed(() => capitalized(this.evaluation().title));
  protected readonly day = computed(() => shortDayLabel(this.evaluation().date, this.locale));
  protected readonly pending = computed(() => this.evaluation().state === 'PENDING');

  /** Le chiffre, son barème et la longueur de sa jauge ; null quand l'état en tient lieu. */
  protected readonly score = computed(() => {
    const score = displayedScore(this.evaluation());
    if (!score) return null;
    const format = (value: number) => formatNumber(value, this.locale, '1.0-2');
    const ratio = score.maxPoints > 0 ? score.points / score.maxPoints : 0;
    return {
      value: format(score.points),
      max: format(score.maxPoints),
      gauge: `${Math.min(Math.max(ratio, 0), 1) * 100}%`,
    };
  });

  protected readonly revised = computed(() => {
    const changedAt = this.evaluation().revisedAt;
    return changedAt ? formatDate(changedAt, 'dd/MM', this.locale) : null;
  });

  /** « Lundi 22 septembre, Mathématiques, Interrogation fractions, 16,5 sur 20, réussie. » */
  protected readonly spoken = computed(() => {
    const evaluation = this.evaluation();
    const score = displayedScore(evaluation);
    const value = score
      ? pointsLabel(score.points, score.maxPoints, this.locale).replace('/', ' sur ')
      : this.state().placeholder?.toLowerCase();
    const parts = [
      spokenDay(evaluation.date, this.locale),
      evaluation.subjectLabel,
      evaluation.title,
      value,
      this.state().word.toLowerCase(),
    ].filter((part): part is string => !!part);
    // « En attente » tient lieu de note et d'état : on ne le dit qu'une fois.
    const unique = parts.filter(
      (part, index) => parts.findIndex((p) => p.toLowerCase() === part.toLowerCase()) === index,
    );
    return `${unique.join(', ')}.`;
  });
}
