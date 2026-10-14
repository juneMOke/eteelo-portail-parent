/**
 * Contrat des devoirs et évaluations du portail parent (lots back P5 et P7), recopié du YAML
 * de l'analyse back « Mes devoirs, Mes évaluations » du 14/10/2026.
 *
 * À remplacer par les types générés (`npm run api:types`) dès que ces routes sont dans
 * l'OpenAPI de staging.
 */

/** Date civile de l'école, `YYYY-MM-DD`. */
export type CivilDate = string;
/** Instant UTC, ISO 8601. */
export type Instant = string;

export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';

/** Statuts calculés par le serveur ; une valeur inconnue s'affiche de façon neutre. */
export type AssignmentStatus =
  | 'UPCOMING'
  | 'DUE'
  | 'SUBMITTED'
  | 'AWAITING_GRADE'
  | 'GRADED'
  | 'ABSENT'
  | 'MISSED'
  | (string & {});

/** Fenêtre rendue par les deux listes : bornes, jour courant de l'école, jours de cours. */
export interface AssignmentWindow {
  readonly from: CivilDate;
  readonly to: CivilDate;
  readonly today: CivilDate;
  readonly schoolDays: readonly Weekday[];
}

export interface EvaluationSummary {
  readonly evaluationId: string;
  readonly type: 'INTERRO' | 'EXAMEN' | (string & {});
  readonly title: string;
  readonly subjectLabel: string;
  readonly teacherLabel: string | null;
  readonly date: CivilDate;
  readonly durationMinutes: number | null;
  readonly status: AssignmentStatus;
  readonly points: number | null;
  readonly maxPoints: number;
}

export interface EvaluationList extends AssignmentWindow {
  readonly items: readonly EvaluationSummary[];
}

export interface AssignmentQuestion {
  readonly number: number;
  readonly statement: string;
  readonly points: number | null;
}

/** Présent quand le statut vaut GRADED ou ABSENT. */
export interface AssignmentResult {
  readonly points: number | null;
  readonly maxPoints: number;
  readonly classAverage: number | null;
  readonly gradedAt: Instant;
  readonly teacherComment: string | null;
  readonly absenceJustified: boolean | null;
}

export interface AssignmentDocument {
  readonly kind: 'SUBJECT' | 'ANSWER_KEY' | 'SUBMISSION' | (string & {});
  readonly fileName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly publishedAt: Instant;
  /** Chemin de la route qui sert le fichier. */
  readonly href: string;
}

export interface EvaluationDetail extends EvaluationSummary {
  readonly announcedAt: Instant;
  readonly programme: readonly string[];
  readonly instructions: string | null;
  /** Vide tant que le corrigé n'est pas publié. */
  readonly questions: readonly AssignmentQuestion[];
  readonly result: AssignmentResult | null;
  readonly documents: readonly AssignmentDocument[];
}
