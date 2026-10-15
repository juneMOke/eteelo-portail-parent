import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { GradeComponent } from '../../../../shared/ui/grade/grade.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { StatusView } from '../../data-access/assignment-status';

/**
 * ③ Carte d'un devoir ou d'une épreuve : quoi, quand, où en est-il, sans ouvrir. Toute la carte
 * mène à la fiche. Pas d'extrait de consigne ni de pièce jointe : trois lignes au plus.
 */
@Component({
  selector: 'app-assignment-card',
  imports: [BadgeComponent, GradeComponent, IconComponent, RouterLink],
  templateUrl: './assignment-card.component.html',
  styleUrl: './assignment-card.component.css',
  host: { '[style.--tone]': "'var(--color-tone-' + status().tone + ')'" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentCardComponent {
  readonly link = input.required<readonly string[]>();
  readonly queryParams = input<Params>({});
  readonly heading = input.required<string>();
  /** Échéance d'un devoir, date et durée d'une épreuve. */
  readonly when = input.required<string>();
  readonly teacher = input<string | null>(null);
  readonly status = input.required<StatusView>();
  /** Note, quand l'épreuve est corrigée : elle remplace le chevron. */
  readonly points = input<number | null>(null);
  readonly maxPoints = input<number | null>(null);

  protected readonly grade = computed(() => {
    const points = this.points();
    const maxPoints = this.maxPoints();
    return points !== null && maxPoints !== null ? { points, maxPoints } : null;
  });
}
