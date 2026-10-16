import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { BadgeComponent } from '../badge/badge.component';
import { GradeComponent } from '../grade/grade.component';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icons';
import { Tone } from '../tone';

/** Le statut d'une carte : son mot, toujours affiché, son ton et son icône. */
export interface CardStatus {
  readonly label: string;
  readonly tone: Tone;
  readonly icon: IconName;
}

/** Un devoir ou une épreuve, déjà mis en mots par sa page. */
export interface AssignmentCardView {
  readonly view: CardStatus;
  readonly heading: string;
  /** « Jeudi 24/09 avant 18 h », « Jeudi 24/09 · 2 h ». */
  readonly when: string;
  /** Dans une colonne de la grille, le jour est déjà dit : « avant 18 h », « 2 h ». */
  readonly compactWhen: string | null;
  /** L'enseignant, ou ce qui était évalué ; la ligne disparaît si elle est vide. */
  readonly detail: string | null;
  /** Mention d'urgence (aujourd'hui, demain), ex. « À rendre demain avant 8 h ». */
  readonly urgent: string | null;
  /** Note publiée : elle remplace le chevron. */
  readonly grade: { readonly points: number; readonly maxPoints: number } | null;
}

/**
 * Carte d'un devoir ou d'une épreuve (spec 03 v2 ④) : quoi, quand, où en est-il, sans ouvrir. Toute la carte
 * mène à la fiche. Au grand écran : filet au ton du statut, pastille d'icône, statut et chevron
 * à droite. Au téléphone, recomposée : statut (et urgence) en haut, puis titre, échéance,
 * enseignant, et un chevron dans un rond. Compacte dans une colonne de la grille. Une note
 * publiée remplace le chevron ; dans Mes cours (`scored`), elle s'y ajoute, en Lora : au-dessus
 * du statut au grand écran, avant le chevron au téléphone.
 */
@Component({
  selector: 'ui-assignment-card',
  imports: [BadgeComponent, GradeComponent, IconComponent, RouterLink],
  templateUrl: './assignment-card.component.html',
  styleUrl: './assignment-card.component.css',
  host: {
    '[class.compact]': 'compact()',
    '[class.scored]': 'scored()',
    '[style.--tone]': "'var(--color-tone-' + card().view.tone + ')'",
    '[style.--tone-soft]': "'var(--color-tone-' + card().view.tone + '-soft)'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentCardComponent {
  readonly card = input.required<AssignmentCardView>();
  readonly link = input.required<readonly string[]>();
  readonly queryParams = input<Params>({});
  /** Dans une colonne de la grille : titre, heure, statut ; ni icône, ni enseignant. */
  readonly compact = input(false);
  /** La note s'ajoute au chevron au lieu de le remplacer (Mes cours, spec 05 v2 ⑤). */
  readonly scored = input(false);
}
