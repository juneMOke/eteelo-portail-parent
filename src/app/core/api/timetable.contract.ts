/**
 * Contrat de Mon emploi du temps (lot back T1), figé le 18/10/2026 dans l'analyse back de la
 * spec 04 · détail. Remplace la grille type P2 (`ParentTimetableResponse`), que le front n'a
 * jamais lue.
 *
 * À remplacer par les types générés (`npm run api:types`) dès que la route est dans l'OpenAPI
 * de staging.
 */
import { CivilDate, Instant } from './assignments.contract';

/** `HH:mm`, heure de l'école. */
export type SchoolTime = string;

/**
 * État d'un jour ; enum ouverte, une valeur inconnue s'affiche comme un jour d'école.
 * `HOLIDAY` n'arrive qu'avec le calendrier des congés (arbitrage A2).
 */
export type TimetableDayState =
  'SCHOOL_DAY' | 'WEEKEND' | 'HOLIDAY' | 'NOT_PUBLISHED' | (string & {});

/** Toujours `SCHEDULED` en V1 : les exceptions de cours attendent l'arbitrage A3. */
export type TimetableCourseStatus = 'SCHEDULED' | 'CANCELLED' | 'CHANGED' | (string & {});

/** L'épreuve posée sur le premier bloc de son cours ce jour-là (arbitrage A6). */
export interface TimetableEvaluation {
  readonly id: string;
  readonly type: 'INTERRO' | 'EXAMEN' | (string & {});
  readonly durationMinutes: number | null;
}

/** Un bloc de cours, déjà fusionné par le serveur (cours double). */
export interface TimetableCourse {
  readonly kind: 'COURSE';
  readonly start: SchoolTime;
  readonly end: SchoolTime;
  readonly durationMinutes: number;
  /** Code de branche MINEDUC (« NUM », « HIST ») ; null hors grille officielle. */
  readonly subjectCode: string | null;
  readonly subjectLabel: string;
  /** Nom complet, sans civilité ; null s'il est inconnu. */
  readonly teacherLabel: string | null;
  readonly room: string | null;
  readonly status: TimetableCourseStatus;
  readonly cancelReason: string | null;
  readonly substituteTeacherLabel: string | null;
  readonly newRoom: string | null;
  readonly evaluation: TimetableEvaluation | null;
}

/** Récréation, pause de midi, temps libre : le libellé vient du serveur. */
export interface TimetableBreak {
  readonly kind: 'BREAK';
  readonly start: SchoolTime;
  readonly end: SchoolTime;
  readonly label: string;
}

export type TimetableItem = TimetableCourse | TimetableBreak;

export interface TimetableDay {
  readonly date: CivilDate;
  readonly state: TimetableDayState;
  readonly holidayLabel: string | null;
  /** Renseigné sur un jour sans cours, borné à la fenêtre. */
  readonly nextSchoolDay: CivilDate | null;
  /** Blocs de cours non annulés. */
  readonly courseCount: number;
  readonly firstStart: SchoolTime | null;
  readonly lastEnd: SchoolTime | null;
  /** Épreuves rattachées, interrogations comprises. */
  readonly examCount: number;
  /** Dans l'ordre du jour, pauses comprises. */
  readonly items: readonly TimetableItem[];
}

export interface TimetableWeek {
  /** Aujourd'hui et l'heure, ceux de l'école (jamais l'horloge du téléphone). */
  readonly today: CivilDate;
  readonly serverTime: Instant;
  readonly timeZone: string;
  /** Lundi de la semaine renvoyée. */
  readonly weekStart: CivilDate;
  /** Année scolaire de l'inscription ; une semaine hors fenêtre répond 400. */
  readonly window: { readonly from: CivilDate; readonly to: CivilDate };
  /** Null en V1 (arbitrage A4). */
  readonly newTimetableFrom: CivilDate | null;
  readonly courseCount: number;
  /** Lundi à vendredi, plus samedi quand la classe a cours ce jour-là (arbitrage A5). */
  readonly days: readonly TimetableDay[];
}
