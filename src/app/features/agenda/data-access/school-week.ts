import { formatDate } from '@angular/common';
import { AssignmentWindow, CivilDate } from '../../../core/api/assignments.contract';
import {
  addDays,
  civilToDate,
  daysBetween,
  isCivilDate,
  mondayOf,
} from '../../../shared/date/civil-date';

/**
 * Calendrier de la vue semaine, en dates civiles de l'école (`YYYY-MM-DD`) : une semaine est
 * désignée par son lundi et montre lundi → vendredi. « Aujourd'hui » est celui du serveur
 * (`today`), jamais l'horloge du téléphone. Navigation seulement : aucun calcul métier.
 */

/** Semaines atteignables de part et d'autre de la semaine en cours (spec 03 v2, ①). */
const WEEK_SPAN = 2;

/** Semaine d'école d'aujourd'hui ; le week-end, la suivante : le dimanche soir, on prépare lundi. */
export function schoolWeekOf(today: CivilDate): CivilDate {
  const weekday = civilToDate(today).getUTCDay();
  const monday = mondayOf(today);
  return weekday === 0 || weekday === 6 ? addDays(monday, 7) : monday;
}

/** Les cinq jours de la semaine, lundi → vendredi. */
export function weekDays(monday: CivilDate): CivilDate[] {
  return [0, 1, 2, 3, 4].map((offset) => addDays(monday, offset));
}

/** Premier et dernier lundis atteignables : deux semaines de part et d'autre, dans la fenêtre. */
export interface WeekRange {
  readonly first: CivilDate;
  readonly last: CivilDate;
}

export function weekRange(window: AssignmentWindow): WeekRange {
  const current = schoolWeekOf(window.today);
  const earliest = addDays(current, -7 * WEEK_SPAN);
  const latest = addDays(current, 7 * WEEK_SPAN);
  const fromMonday = mondayOf(window.from);
  const toMonday = mondayOf(window.to);
  const first = fromMonday > earliest ? fromMonday : earliest;
  const last = toMonday < latest ? toMonday : latest;
  return first <= last ? { first, last } : { first: current, last: current };
}

function clampWeek(monday: CivilDate, range: WeekRange): CivilDate {
  if (monday < range.first) return range.first;
  if (monday > range.last) return range.last;
  return monday;
}

/**
 * Semaine d'ouverture : celle demandée (`?week=`, à défaut le jour `?date=` d'un lien venu
 * d'ailleurs) si elle est atteignable ; sinon la semaine en cours.
 */
export function openingWeek(
  window: AssignmentWindow,
  week: string | null | undefined,
  date: string | null | undefined,
): CivilDate {
  const range = weekRange(window);
  for (const day of [week, date]) {
    if (!isCivilDate(day)) continue;
    const monday = mondayOf(day);
    if (monday >= range.first && monday <= range.last) return monday;
  }
  return clampWeek(schoolWeekOf(window.today), range);
}

/** Écart en semaines avec la semaine en cours : 0, 1, -2… */
export function weekOffset(monday: CivilDate, today: CivilDate): number {
  return Math.round(daysBetween(schoolWeekOf(today), monday) / 7);
}

/** « 1er », « 2 » : le quantième à la française. */
function dayOfMonth(day: CivilDate): string {
  const value = civilToDate(day).getUTCDate();
  return value === 1 ? '1er' : String(value);
}

function format(day: CivilDate, pattern: string, locale: string): string {
  return formatDate(civilToDate(day), pattern, locale, 'UTC');
}

/**
 * « Semaine du 21 au 25 septembre 2026 » ; à cheval : « Semaine du 29 septembre au 3 octobre
 * 2026 », « Semaine du 29 décembre 2025 au 2 janvier 2026 ».
 */
export function weekLabel(monday: CivilDate, locale: string): string {
  const friday = addDays(monday, 4);
  const end = `${dayOfMonth(friday)} ${format(friday, 'MMMM y', locale)}`;
  if (monday.slice(0, 7) === friday.slice(0, 7)) {
    return `Semaine du ${dayOfMonth(monday)} au ${end}`;
  }
  const startPattern = monday.slice(0, 4) === friday.slice(0, 4) ? 'MMMM' : 'MMMM y';
  return `Semaine du ${dayOfMonth(monday)} ${format(monday, startPattern, locale)} au ${end}`;
}

/** « 21 – 25 sept. », « 29 sept. – 3 oct. » : l'intitulé court du téléphone. */
export function shortWeekLabel(monday: CivilDate, locale: string): string {
  const friday = addDays(monday, 4);
  const end = `${dayOfMonth(friday)} ${format(friday, 'MMM', locale)}`;
  if (monday.slice(0, 7) === friday.slice(0, 7)) return `${dayOfMonth(monday)} – ${end}`;
  return `${dayOfMonth(monday)} ${format(monday, 'MMM', locale)} – ${end}`;
}

/** « aujourd'hui », « demain », « hier » ; null au-delà. */
export function nearDay(day: CivilDate, today: CivilDate): string | null {
  const offset = daysBetween(today, day);
  if (offset === 0) return 'aujourd’hui';
  if (offset === 1) return 'demain';
  if (offset === -1) return 'hier';
  return null;
}
