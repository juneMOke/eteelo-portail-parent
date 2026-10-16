import { AssignmentStatus, CivilDate } from '../../../core/api/assignments.contract';
import { Tone } from '../../../shared/ui/tone';
import { StatusView } from './assignment-status';

/**
 * Modèle de la vue semaine commune à Mes devoirs et Mes évaluations : chaque page met ses
 * éléments en forme en cartes, puis la vue les range par jour et les filtre. Compter les
 * cartes d'un filtre n'est pas un calcul métier : les statuts viennent du serveur.
 */

/** Un devoir ou une épreuve, déjà mis en mots par sa page. */
export interface WeekCard {
  readonly id: string;
  /** Jour où la carte se range : l'échéance d'un devoir, la date d'une épreuve. */
  readonly day: CivilDate;
  readonly status: AssignmentStatus;
  readonly view: StatusView;
  readonly heading: string;
  /** « Jeudi 24/09 avant 18 h », « Jeudi 24/09 · 2 h ». */
  readonly when: string;
  /** Dans une colonne de la grille, le jour est déjà dit : « avant 18 h », « 2 h ». */
  readonly compactWhen: string | null;
  /** L'enseignant ; la ligne disparaît s'il est inconnu. */
  readonly detail: string | null;
  /** Mention d'urgence (aujourd'hui, demain), ex. « À rendre demain avant 8 h ». */
  readonly urgent: string | null;
  /** Note publiée : elle remplace le chevron. */
  readonly grade: { readonly points: number; readonly maxPoints: number } | null;
}

/** Une option du filtre par statut, au ton de son statut. */
export interface StatusFilter {
  readonly id: string;
  readonly label: string;
  readonly tone: Tone;
  /** Titre du vide quand ce filtre ne trouve rien, ex. « Aucun devoir non rendu ». */
  readonly empty: string;
}

/** Une option affichée (pastille ou menu) : son libellé, son compteur, son ton éventuel. */
export interface FilterOption {
  /** Null vaut « tout » (« Toute la semaine », « Tous »). */
  readonly id: string | null;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone | null;
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

export type WeekView = 'grid' | 'list';
