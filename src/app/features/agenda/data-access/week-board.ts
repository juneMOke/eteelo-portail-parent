import { AssignmentStatus, CivilDate } from '../../../core/api/assignments.contract';
import { AssignmentCardView } from '../../../shared/ui/assignment-card/assignment-card.component';
import { Tone } from '../../../shared/ui/tone';

/**
 * Modèle de la vue semaine commune à Mes devoirs et Mes évaluations : chaque page met ses
 * éléments en forme en cartes, puis la vue les range par jour et les filtre. Compter les
 * cartes d'un filtre n'est pas un calcul métier : les statuts viennent du serveur.
 */

/** Un devoir ou une épreuve, déjà mis en mots par sa page. */
export interface WeekCard extends AssignmentCardView {
  readonly id: string;
  /** Jour où la carte se range : l'échéance d'un devoir, la date d'une épreuve. */
  readonly day: CivilDate;
  readonly status: AssignmentStatus;
}

/** Une option du filtre par statut, au ton de son statut. */
export interface StatusFilter {
  readonly id: string;
  readonly label: string;
  readonly tone: Tone;
  /** Titre du vide quand ce filtre ne trouve rien, ex. « Aucun devoir non rendu ». */
  readonly empty: string;
}

/** Les mots qui changent entre les deux pages. */
export interface WeekBoardLabels {
  /** Nom de la région des cartes, ex. « Devoirs de la semaine ». */
  readonly region: string;
  /** « 1 devoir », « 3 devoirs », « Aucun devoir » : annoncé au changement de semaine. */
  readonly one: string;
  readonly many: string;
  readonly none: string;
  /** Option « tout » du filtre par statut : « Tous », « Toutes ». */
  readonly all: string;
  readonly statuses: readonly StatusFilter[];
  /** « Aucun devoir cette semaine ». */
  readonly emptyWeek: string;
  /** « Aucun devoir à rendre ce jour ». */
  readonly emptyDay: string;
  /** Colonne vide de la grille : « Rien à rendre ». */
  readonly emptyColumn: string;
}
