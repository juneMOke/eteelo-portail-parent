/**
 * Contrat de Mes notes (lots back P10 à P13), recopié du contrat figé le 15/10/2026 dans le
 * retour du front sur la spec 05, accepté par l'analyse back du même jour.
 *
 * À remplacer par les types générés (`npm run api:types`) dès que ces routes sont dans
 * l'OpenAPI de staging.
 */
import { CivilDate, Instant } from './assignments.contract';

/** État d'une évaluation, calculé par le serveur ; une valeur inconnue s'affiche de façon neutre. */
export type GradeState =
  | 'PASSED'
  | 'AVERAGE'
  | 'FAILED'
  | 'PENDING'
  | 'ABSENT_EXCUSED'
  | 'ABSENT_UNEXCUSED'
  | (string & {});

/** Une évaluation, identique sur Ma semaine, Mes cours et la fiche. */
export interface GradedEvaluation {
  readonly evaluationId: string;
  readonly courseId: string;
  /** Une interrogation ou un examen s'ouvre dans Mes évaluations, un devoir dans Mes devoirs. */
  readonly kind: 'INTERRO' | 'EXAMEN' | 'HOMEWORK' | (string & {});
  readonly title: string;
  readonly subjectLabel: string;
  /** Code de la branche dans la grille : « NUM », « GEO ». */
  readonly subjectCode: string;
  readonly date: CivilDate;
  readonly notions: readonly string[];
  readonly state: GradeState;
  /** Null en attente ou pour une absence justifiée ; 0 pour une absence non justifiée. */
  readonly points: number | null;
  readonly maxPoints: number;
  /** Note révisée après publication des notes. */
  readonly gradeChangedAt: Instant | null;
}

export interface GradeCounts {
  readonly total: number;
  readonly graded: number;
  readonly pending: number;
}

/** `GET grades/week?date=` : une semaine, de son lundi à son dernier jour de cours. */
export interface GradeWeek {
  readonly from: CivilDate;
  readonly to: CivilDate;
  /** Lundi de la semaine de rentrée, borne gauche du navigateur. */
  readonly firstWeekStart: CivilDate;
  /** Lundi de la semaine en cours, borne droite : aucune note n'existe au-delà. */
  readonly currentWeekStart: CivilDate;
  /** Pour sortir d'une semaine vide. */
  readonly lastEvaluationDate: CivilDate | null;
  readonly counts: GradeCounts;
  /** Par jour, puis dans l'ordre du bulletin. */
  readonly items: readonly GradedEvaluation[];
}

export interface TermPeriod {
  /** Identifiant opaque ; celui d'un examen est dérivé de son trimestre. */
  readonly periodId: string;
  readonly label: string;
  readonly kind: 'PERIOD' | 'EXAM' | (string & {});
  readonly opensOn: CivilDate;
  readonly available: boolean;
}

export interface Term {
  readonly termId: string;
  readonly label: string;
  readonly opensOn: CivilDate;
  readonly available: boolean;
  readonly periods: readonly TermPeriod[];
}

export interface TermSelection {
  readonly termId: string;
  /** Null : tout le trimestre. */
  readonly periodId: string | null;
  /** « 1er trimestre · 2e période ». */
  readonly label: string;
}

/** Arbre trimestre · période et sélection retenue, dans Mes cours et Mon bulletin. */
export interface TermTree {
  readonly terms: readonly Term[];
  readonly selection: TermSelection;
}

/** Une moyenne : un pourcentage, jamais une note sur 20. */
export interface Average {
  readonly percent: number;
  readonly obtained: number;
  readonly max: number;
}

export interface LastGrade {
  readonly points: number;
  readonly maxPoints: number;
  readonly date: CivilDate;
}

export interface CourseGrades {
  readonly courseId: string;
  readonly label: string;
  readonly subjectCode: string;
  readonly teacherLabel: string | null;
  /** Null : pas encore d'évaluation notée. */
  readonly average: Average | null;
  readonly evaluationCount: number;
  readonly last: LastGrade | null;
  /** La plus récente en haut. */
  readonly evaluations: readonly GradedEvaluation[];
}

/** `GET grades/courses?termId=&periodId=` : les cours dans l'ordre du bulletin. */
export interface GradeCourses extends TermTree {
  readonly courses: readonly CourseGrades[];
}

export interface Rank {
  readonly position: number;
  readonly classSize: number;
}

export interface Evolution {
  /** En points de pourcentage, signé. */
  readonly delta: number;
  /** « la 1re période ». */
  readonly comparedToLabel: string;
}

export interface ReportCardLine {
  readonly courseId: string;
  readonly label: string;
  readonly teacherLabel: string | null;
  readonly average: Average | null;
}

export interface ReportCardDocument {
  readonly reportCardId: string;
  readonly fileName: string;
  readonly sizeBytes: number;
  /** « la direction ». */
  readonly signedBy: string;
}

/** `GET grades/report-card?termId=&periodId=` : officiel (publié par l'école) ou provisoire. */
export interface ReportCard extends TermTree {
  readonly status: 'OFFICIAL' | 'PROVISIONAL' | (string & {});
  /** « Moyenne de l'année au 2e trimestre » (officiel, cumulé) ou « 2e trimestre · 1re période ». */
  readonly scopeLabel: string;
  readonly publishedAt: Instant | null;
  /** Date d'un rectificatif émis après la publication. */
  readonly updatedAt: Instant | null;
  /** Nombre de notes d'une moyenne provisoire. */
  readonly gradedCount: number | null;
  readonly average: Average | null;
  /** Seulement sur un bulletin officiel. */
  readonly rank: Rank | null;
  /** Seulement entre deux sélections provisoires. */
  readonly evolution: Evolution | null;
  readonly lines: readonly ReportCardLine[];
  readonly document: ReportCardDocument | null;
}

/** Sélection demandée au serveur ; absente, il choisit la sélection par défaut de la page. */
export interface TermQuery {
  readonly termId?: string;
  readonly periodId?: string;
}
