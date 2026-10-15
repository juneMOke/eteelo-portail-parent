/**
 * Contrat de Mes notes (lots back P10 à P13), recopié des DTO de `ParentGradesController`
 * (branche back `feat/parent-grades`, 15/10/2026).
 *
 * À remplacer par les types générés (`npm run api:types`) dès que ces routes sont dans
 * l'OpenAPI de staging.
 */
import { CivilDate, Instant } from './assignments.contract';

/** État d'une évaluation ou ton d'une moyenne, calculé par le serveur ; une valeur inconnue s'affiche de façon neutre. */
export type GradeState =
  | 'PASSED'
  | 'AVERAGE'
  | 'FAILED'
  | 'PENDING'
  | 'ABSENT_EXCUSED'
  | 'ABSENT_UNEXCUSED'
  | (string & {});

/** Une évaluation sur sa carte, identique sur Ma semaine et Mes cours. */
export interface GradeCard {
  readonly evaluationId: string;
  readonly courseId: string;
  /** Une interrogation ou un examen s'ouvre dans Mes évaluations, un devoir dans Mes devoirs. */
  readonly kind: 'TEST' | 'EXAM' | 'HOMEWORK' | (string & {});
  readonly title: string;
  readonly subjectLabel: string;
  /** Code de la branche dans la grille : « NUM », « GEO ». */
  readonly subjectCode: string;
  readonly date: CivilDate;
  /** Ce qui était évalué. */
  readonly topics: readonly string[];
  readonly state: GradeState;
  /** Null en attente ou pour une absence justifiée ; 0 pour une absence non justifiée. */
  readonly points: number | null;
  readonly maxPoints: number;
  /** « Note modifiée le » ; null si la note n'a pas bougé depuis sa publication. */
  readonly revisedAt: Instant | null;
  /** Route d'API de la fiche ; le front ouvre la fiche par son propre routeur. */
  readonly href: string;
}

/** « 6 évaluations · 4 notées · 2 en attente ». */
export interface GradeSummary {
  readonly total: number;
  readonly graded: number;
  readonly pending: number;
}

export interface GradeDay {
  readonly date: CivilDate;
  /** Dans l'ordre du bulletin. */
  readonly items: readonly GradeCard[];
}

/** `GET grades/week?weekOf=` : une semaine, du lundi au samedi. */
export interface GradeWeek {
  readonly weekStart: CivilDate;
  readonly weekEnd: CivilDate;
  /** Lundi de la semaine de rentrée, borne gauche du navigateur. */
  readonly firstWeek: CivilDate;
  /** Lundi de la semaine en cours, borne droite : aucune note n'existe au-delà. */
  readonly currentWeek: CivilDate;
  readonly summary: GradeSummary;
  /** Les jours qui ont au moins une évaluation, dans l'ordre. */
  readonly days: readonly GradeDay[];
  /** Quand la semaine est vide : le jour de la dernière évaluation d'avant. */
  readonly lastEvaluationDate: CivilDate | null;
}

/** Portion d'une période scolaire : toute la période, l'une de ses deux sous-périodes, son examen. */
export type GradePart = 'ALL' | 'FIRST' | 'SECOND' | 'EXAM' | (string & {});

export interface GradePeriodPart {
  readonly part: GradePart;
  /** « 1re période », « Examen ». */
  readonly label: string;
  readonly status: 'OPEN' | 'CLOSED' | (string & {});
  /** Null pour l'examen, qui n'a pas de dates propres. */
  readonly startDate: CivilDate | null;
  readonly endDate: CivilDate | null;
  readonly current: boolean;
}

/** `GET grades/periods` : une période scolaire (trimestre ou semestre) de l'année de l'enfant. */
export interface GradePeriod {
  readonly periodId: string;
  /** « 1er trimestre », « 2e semestre ». */
  readonly label: string;
  readonly order: number;
  readonly status: 'OPEN' | 'CLOSED' | (string & {});
  readonly startDate: CivilDate | null;
  readonly endDate: CivilDate | null;
  readonly current: boolean;
  /** FIRST, SECOND puis EXAM. */
  readonly parts: readonly GradePeriodPart[];
}

/** La portion effectivement lue, défauts appliqués. */
export interface GradeSelection {
  readonly periodId: string;
  readonly part: GradePart;
  /** « 1er trimestre · 2e période ». */
  readonly label: string;
}

/** Une moyenne : un pourcentage, jamais une note sur 20, avec son ton. */
export interface GradeAverage {
  readonly percent: number;
  readonly obtained: number;
  readonly max: number;
  readonly state: GradeState;
}

export interface LastGrade {
  readonly points: number;
  readonly maxPoints: number;
  readonly date: CivilDate;
}

export interface GradeCourse {
  readonly courseId: string;
  readonly subjectLabel: string;
  readonly subjectCode: string;
  readonly teacherLabel: string | null;
  readonly order: number;
  /** Null : pas encore d'évaluation notée. */
  readonly average: GradeAverage | null;
  /** Les évaluations listées. */
  readonly count: number;
  readonly last: LastGrade | null;
  /** La plus récente en haut. */
  readonly evaluations: readonly GradeCard[];
}

/** `GET grades/courses?periodId=&part=` : les cours dans l'ordre du bulletin. */
export interface GradeCourses {
  /** Null quand l'année de l'enfant n'a aucune période scolaire. */
  readonly selection: GradeSelection | null;
  readonly courses: readonly GradeCourse[];
}

/** « 8e sur 32 ». */
export interface Rank {
  readonly position: number;
  readonly of: number;
}

export interface Evolution {
  /** En points de pourcentage, signé. */
  readonly points: number;
  /** « 1er trimestre · 1re période ». */
  readonly versus: string;
}

/** Une ligne par cours ; un cours sans note garde sa ligne, en fin de liste, sans chiffre. */
export interface ReportCardLine {
  readonly courseId: string;
  readonly subjectLabel: string;
  readonly subjectCode: string;
  readonly percent: number | null;
  readonly obtained: number | null;
  readonly max: number | null;
  readonly state: GradeState | null;
}

export interface ReportCardDocument {
  /** Route du PDF signé. */
  readonly href: string;
  /** Numéro de la pièce. */
  readonly number: string;
  readonly sizeBytes: number;
}

/** `GET grades/report-card?periodId=&part=` : officiel (publié par l'école) ou provisoire. */
export interface ReportCard {
  readonly selection: GradeSelection | null;
  readonly status: 'OFFICIAL' | 'PROVISIONAL' | (string & {});
  readonly scope: 'YEAR_TO_DATE' | 'PERIOD' | (string & {});
  /** « Moyenne de l'année au 2e trimestre », « Moyenne provisoire · 1er trimestre ». */
  readonly averageLabel: string | null;
  /** Officiel seulement. */
  readonly publishedAt: Instant | null;
  /** Provisoire seulement : « Calculée sur 14 notes ». */
  readonly gradedCount: number | null;
  readonly average: Pick<GradeAverage, 'percent' | 'state'> | null;
  /** Officiel seulement, et pour un élève classé. */
  readonly rank: Rank | null;
  /** Provisoire seulement, quand la portion précédente a une moyenne. */
  readonly evolution: Evolution | null;
  readonly lines: readonly ReportCardLine[];
  /** Le bulletin signé, officiel seulement. */
  readonly document: ReportCardDocument | null;
}

/** Portion demandée au serveur ; absente, il choisit le défaut de la page. */
export interface GradeQuery {
  readonly periodId?: string;
  readonly part?: GradePart;
}
