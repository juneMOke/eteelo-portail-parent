import { formatDate } from '@angular/common';
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
import { GradeComponent } from '../../../../shared/ui/grade/grade.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { pointsLabel, spokenDay } from '../../data-access/grade-formats';
import { displayedScore, gradeStateView } from '../../data-access/grade-state';

/**
 * ② Carte de résultat (Ma semaine) et ⑤ ligne d'évaluation (Mes cours) : mêmes mots, mêmes
 * tons, la note toujours à droite. Filet au ton de l'état, sigle facultatif, titre, ligne de
 * contexte (matière ou jour, puis notions) ; toute la carte ouvre la fiche.
 */
@Component({
  selector: 'app-result-card',
  imports: [GradeComponent, IconComponent, RouterLink],
  templateUrl: './result-card.component.html',
  styleUrl: './result-card.component.css',
  host: { '[style.--tone]': "'var(--color-tone-' + state().tone + ')'" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultCardComponent {
  readonly evaluation = input.required<GradeCard>();
  readonly link = input.required<readonly string[]>();
  readonly queryParams = input<Params>({});
  /** Ce qui précède les notions : la matière (Ma semaine) ou le jour (Mes cours). */
  readonly context = input.required<string>();
  /** Sigle de la matière, montré sur Ma semaine seulement. */
  readonly showCode = input(false);

  private readonly locale = inject(LOCALE_ID);

  protected readonly state = computed(() => gradeStateView(this.evaluation().state));
  protected readonly score = computed(() => displayedScore(this.evaluation()));
  protected readonly contextLine = computed(() =>
    [this.context(), this.evaluation().topics.join(', ')].filter(Boolean).join(' · '),
  );
  protected readonly revised = computed(() => {
    const changedAt = this.evaluation().revisedAt;
    return changedAt ? formatDate(changedAt, 'dd/MM', this.locale) : null;
  });
  /** « Lundi 22 septembre, Mathématiques, Interrogation fractions, 16,5 sur 20, réussie. » */
  protected readonly spoken = computed(() => {
    const evaluation = this.evaluation();
    const score = this.score();
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
