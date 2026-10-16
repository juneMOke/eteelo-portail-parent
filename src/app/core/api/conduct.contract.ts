/**
 * Contrat de Ma conduite (lots back C1 et C2), recopié de l'analyse back « Ma conduite » figée
 * le 15/10/2026 (amendements A1 à A6 du front compris) et des DTO de la route P4.
 *
 * À remplacer par les types générés (`npm run api:types`) dès que ces routes sont dans
 * l'OpenAPI de staging.
 */
import { CivilDate, Instant } from './assignments.contract';

/** Statut d'un jour appelé ; une valeur inconnue s'affiche de façon neutre. */
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | (string & {});

/** Motif d'une absence, posé par l'école (appel ou justification acceptée). */
export type AbsenceReason =
  | 'SICKNESS'
  | 'FAMILY_EMERGENCY'
  | 'PERSONAL'
  | 'MEDICAL_APPOINTMENT'
  | 'TRANSPORT'
  | 'BEREAVEMENT'
  | 'BAD_WEATHER'
  | 'VACATION'
  | 'OTHER'
  | 'UNJUSTIFIED'
  | 'UNKNOWN'
  | (string & {});

/** Motifs qu'un parent peut donner en justifiant. */
export type JustificationReason = 'SICKNESS' | 'FAMILY_EMERGENCY' | 'TRANSPORT' | 'OTHER';

export type JustificationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | (string & {});

/** La dernière justification envoyée pour un jour, et la décision de l'école. */
export interface AbsenceJustification {
  readonly status: JustificationStatus;
  readonly reason: JustificationReason | (string & {});
  readonly submittedAt: Instant;
  readonly decidedAt: Instant | null;
  /** Ce que l'école dit d'un refus, s'il y a lieu. */
  readonly decisionNote: string | null;
}

/** Fait disciplinaire relié à un jour (pont dérivé, arbitrage 7). */
export interface LinkedCase {
  readonly id: string;
  readonly sanction: Sanction;
  /** Trimestre qui contient la date du fait ; null si aucun ne la couvre. */
  readonly periodId: string | null;
}

/** Un jour où l'appel a été fait dans la classe de l'enfant (ou un constat isolé, A6). */
export interface AttendanceDay {
  readonly date: CivilDate;
  readonly status: AttendanceStatus;
  /** Renseigné pour une absence, null sinon. */
  readonly justified: boolean | null;
  readonly absenceReason: AbsenceReason | null;
  readonly absenceReasonNote: string | null;
  /** `HH:mm`, pour un retard. */
  readonly arrivalTime: string | null;
  readonly lateMinutes: number | null;
  /** Qui a fait l'appel ce jour-là, et quand. */
  readonly recordedBy: string | null;
  readonly recordedAt: Instant | null;
  /** Dernier jour pour justifier ; null si rien à justifier ou délai passé. */
  readonly justifyUntil: CivilDate | null;
  readonly justification: AbsenceJustification | null;
  readonly disciplinaryCases: readonly LinkedCase[];
}

/** Résumé de la plage, calculé par le serveur ; `presenceRate` entre 0 et 1. */
export interface AttendanceSummary {
  readonly schoolDays: number;
  /** Retards compris. */
  readonly presentDays: number;
  readonly lateDays: number;
  readonly justifiedAbsenceDays: number;
  readonly unjustifiedAbsenceDays: number;
  readonly presenceRate: number;
}

/** Comptes d'un mois de la plage (A1), mêmes règles que le résumé. */
export interface AttendanceMonth {
  /** `YYYY-MM`. */
  readonly month: string;
  readonly calledDays: number;
  readonly absences: number;
  readonly lates: number;
}

export interface AbsenceToJustify {
  readonly date: CivilDate;
  readonly justifyUntil: CivilDate;
}

/**
 * `GET attendance?from&to` : sans borne, du début de l'année scolaire à aujourd'hui. `to` est
 * alors le jour de l'école.
 */
export interface ChildAttendance {
  readonly from: CivilDate;
  readonly to: CivilDate;
  readonly summary: AttendanceSummary;
  readonly months: readonly AttendanceMonth[];
  /** Toute l'année, indépendant de `from` et `to`. */
  readonly toJustify: readonly AbsenceToJustify[];
  readonly days: readonly AttendanceDay[];
}

/** Plage demandée à `GET attendance`, bornes comprises, dans l'année scolaire. */
export interface AttendanceRange {
  readonly from: CivilDate;
  readonly to: CivilDate;
}

/** Justification envoyée par le parent (`POST attendance/{date}/justification`). */
export interface JustificationRequest {
  /** Uuid choisi par le client : un renvoi du même id est sans effet. */
  readonly id: string;
  readonly reason: JustificationReason;
  /** 200 caractères au plus. */
  readonly note: string;
  readonly file: File | null;
}

/** Causes fines d'un refus de justification (422) ; toutes terminales. */
export type JustificationRefusal =
  | 'NOT_AN_ABSENCE'
  | 'ALREADY_JUSTIFIED'
  | 'JUSTIFICATION_PENDING'
  | 'JUSTIFICATION_CLOSED'
  | (string & {});

export type Severity = 'MINOR' | 'MAJOR' | 'SERIOUS' | (string & {});

export type Sanction =
  | 'ORAL_WARNING'
  | 'WRITTEN_WARNING'
  | 'DETENTION'
  | 'PARENTS_SUMMONED'
  | 'TEMPORARY_EXCLUSION'
  | 'DISCIPLINARY_COUNCIL'
  | 'PERMANENT_EXCLUSION'
  | 'UNKNOWN'
  | (string & {});

export type DisciplineCategory =
  | 'DISRUPTIVE_BEHAVIOR'
  | 'LATENESS'
  | 'REPEATED_LATENESS'
  | 'UNJUSTIFIED_ABSENCE'
  | 'INSOLENCE'
  | 'CHEATING'
  | 'FIGHTING'
  | 'DRESS_CODE_VIOLATION'
  | 'TALKING_IN_CLASS'
  | 'UNKNOWN'
  | (string & {});

/** Un trimestre de l'année, les mêmes que Mes notes (A4). */
export interface DisciplinePeriod {
  readonly id: string;
  /** « 1er trimestre ». */
  readonly label: string;
  readonly startDate: CivilDate | null;
  readonly endDate: CivilDate | null;
  readonly current: boolean;
}

/** Ce que la page de présence ouvre depuis un fait (A3) : un jour, ou un mois (1er du mois). */
export interface LinkedAttendance {
  readonly kind: 'DAY' | 'MONTH' | (string & {});
  readonly date: CivilDate;
}

/** Un fait consigné par l'école ; jamais un fait classé sans suite. */
export interface DisciplineCase {
  readonly id: string;
  readonly date: CivilDate;
  readonly title: string;
  readonly category: DisciplineCategory;
  readonly severity: Severity;
  readonly sanction: Sanction | null;
  /** Entière, jamais tronquée. */
  readonly description: string | null;
  readonly recordedBy: string | null;
  readonly recordedAt: Instant | null;
  /** « Mis à jour le » ; null si le fait n'a pas changé. */
  readonly revisedAt: Instant | null;
  /** Ce que l'école attend du parent : un entretien quand la sanction convoque les parents. */
  readonly parentRequest: 'MEETING' | (string & {}) | null;
  readonly linkedAttendance: LinkedAttendance | null;
}

/** `GET discipline?periodId` : un trimestre, par défaut celui en cours. */
export interface ChildDiscipline {
  readonly period: Omit<DisciplinePeriod, 'current'>;
  readonly periods: readonly DisciplinePeriod[];
  readonly summary: { readonly minor: number; readonly major: number; readonly serious: number };
  /** Le plus récent en tête. */
  readonly cases: readonly DisciplineCase[];
}
