/**
 * Dates civiles de l'école (`YYYY-MM-DD`) : aucune heure, aucun fuseau. Calendrier de
 * navigation seulement, aucun calcul métier.
 */

/** Date civile, `YYYY-MM-DD`. */
export type CivilDate = string;

const DAY_MS = 86_400_000;
const CIVIL_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Minuit UTC du jour civil : se formate avec le fuseau 'UTC' pour ne jamais glisser d'un jour. */
export function civilToDate(day: CivilDate): Date {
  return new Date(`${day}T00:00:00Z`);
}

export function isCivilDate(value: string | null | undefined): value is CivilDate {
  return !!value && CIVIL_DATE.test(value) && !Number.isNaN(civilToDate(value).getTime());
}

export function addDays(day: CivilDate, count: number): CivilDate {
  return new Date(civilToDate(day).getTime() + count * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: CivilDate, to: CivilDate): number {
  return Math.round((civilToDate(to).getTime() - civilToDate(from).getTime()) / DAY_MS);
}

/** Lundi de la semaine du jour. */
export function mondayOf(day: CivilDate): CivilDate {
  const weekday = civilToDate(day).getUTCDay();
  return addDays(day, weekday === 0 ? -6 : 1 - weekday);
}

/** Mois civil, `YYYY-MM`. */
export type CivilMonth = string;

const CIVIL_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isCivilMonth(value: string | null | undefined): value is CivilMonth {
  return !!value && CIVIL_MONTH.test(value);
}

/** Mois du jour. */
export function monthOf(day: CivilDate): CivilMonth {
  return day.slice(0, 7);
}

/** Premier jour du mois. */
export function firstDayOf(month: CivilMonth): CivilDate {
  return `${month}-01`;
}

export function addMonths(month: CivilMonth, count: number): CivilMonth {
  const [year, index] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, index - 1 + count, 1));
  return date.toISOString().slice(0, 7);
}

/** Les jours du mois, du 1er au dernier. */
export function daysOf(month: CivilMonth): CivilDate[] {
  const days: CivilDate[] = [];
  for (let day = firstDayOf(month); monthOf(day) === month; day = addDays(day, 1)) days.push(day);
  return days;
}
