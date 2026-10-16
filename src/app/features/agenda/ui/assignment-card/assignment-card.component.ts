import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { GradeComponent } from '../../../../shared/ui/grade/grade.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { WeekCard } from '../../data-access/week-board';

/**
 * ④ Carte d'un devoir ou d'une épreuve : quoi, quand, où en est-il, sans ouvrir. Toute la carte
 * mène à la fiche. Au grand écran : filet au ton du statut, pastille d'icône, statut et chevron
 * à droite. Au téléphone, recomposée : statut (et urgence) en haut, puis titre, échéance,
 * enseignant, et un chevron dans un rond. Compacte dans une colonne de la grille. Une note
 * publiée remplace le chevron.
 */
@Component({
  selector: 'app-assignment-card',
  imports: [BadgeComponent, GradeComponent, IconComponent, RouterLink],
  templateUrl: './assignment-card.component.html',
  styleUrl: './assignment-card.component.css',
  host: {
    '[class.compact]': 'compact()',
    '[style.--tone]': "'var(--color-tone-' + card().view.tone + ')'",
    '[style.--tone-soft]': "'var(--color-tone-' + card().view.tone + '-soft)'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentCardComponent {
  readonly card = input.required<WeekCard>();
  readonly link = input.required<readonly string[]>();
  readonly queryParams = input<Params>({});
  /** Dans une colonne de la grille : titre, heure, statut ; ni icône, ni enseignant. */
  readonly compact = input(false);
}
