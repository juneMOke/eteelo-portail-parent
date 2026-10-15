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

/** Cours de l'évaluation dans Mes notes (lot P10) ; absent tant que P10 n'est pas livré. */
export interface CourseReference {
  readonly courseId?: string | null;
}

export interface EvaluationDetail extends EvaluationSummary, CourseReference {
  readonly announcedAt: Instant;
  readonly programme: readonly string[];
  readonly instructions: string | null;
  /** Vide tant que le corrigé n'est pas publié. */
  readonly questions: readonly AssignmentQuestion[];
  readonly result: AssignmentResult | null;
  readonly documents: readonly AssignmentDocument[];
}

/** Remise d'un devoir : déposé en ligne, ou remis en classe à l'enseignant. */
export type DeliveryMode = 'ONLINE' | 'IN_CLASS' | (string & {});

export interface HomeworkSummary {
  readonly evaluationId: string;
  readonly title: string;
  readonly subjectLabel: string;
  readonly teacherLabel: string | null;
  /** Jour de l'échéance, dans le fuseau de l'école ; c'est le jour où la liste range le devoir. */
  readonly dueDate: CivilDate;
  /** Heure limite `HH:mm` ; null si l'enseignant n'en a pas fixé. */
  readonly dueTime: string | null;
  /** Échéance en UTC ; fin de `dueDate` quand `dueTime` est null. */
  readonly dueAt: Instant;
  readonly deliveryMode: DeliveryMode;
  readonly status: AssignmentStatus;
  readonly points: number | null;
  readonly maxPoints: number;
}

export interface HomeworkList extends AssignmentWindow {
  readonly items: readonly HomeworkSummary[];
}

/** Copie déposée par le parent (lot P9) : la plus récente fait foi. */
export interface HomeworkSubmission {
  readonly submittedAt: Instant;
  /** Déposée après l'échéance, sous dépôt tardif permis. */
  readonly late: boolean;
  /** Dans l'ordre des pages, `kind` `SUBMISSION`. */
  readonly files: readonly AssignmentDocument[];
}

/** Causes fines d'un refus de dépôt (422) ; toutes terminales : le même envoi échouera toujours. */
export type SubmissionRefusal =
  | 'SUBMISSION_NOT_ONLINE'
  | 'SUBMISSION_CLOSED'
  | 'UNSUPPORTED_DOCUMENT_TYPE'
  | 'EMPTY_DOCUMENT'
  | 'DOCUMENT_TOO_LARGE'
  | 'SUBMISSION_TOO_MANY_FILES'
  | (string & {});

export interface HomeworkDetail extends HomeworkSummary, CourseReference {
  readonly assignedAt: Instant;
  readonly lateSubmissionAllowed: boolean;
  readonly programme: readonly string[];
  readonly instructions: string | null;
  /** Toujours présentes : un devoir est visible avec ses questions dès sa création. */
  readonly questions: readonly AssignmentQuestion[];
  readonly result: AssignmentResult | null;
  readonly documents: readonly AssignmentDocument[];
  /** null sans dépôt. */
  readonly submission: HomeworkSubmission | null;
}
