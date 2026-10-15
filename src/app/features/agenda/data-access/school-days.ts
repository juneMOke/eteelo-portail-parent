import { AssignmentWindow, CivilDate, Weekday } from '../../../core/api/assignments.contract';
import { addDays, civilToDate, daysBetween, isCivilDate } from '../../../shared/date/civil-date';

/**
 * Calendrier du navigateur de jour, en dates civiles de l'école (`YYYY-MM-DD`) : aucune
 * heure, aucun fuseau. « Aujourd'hui » est celui du serveur (`today`), jamais l'horloge du
 * téléphone. Navigation seulement : aucun calcul métier.
 */

const WEEKDAYS: readonly (Weekday | 'SUN')[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export function isSchoolDay(day: CivilDate, window: AssignmentWindow): boolean {
  const weekday = WEEKDAYS[civilToDate(day).getUTCDay()];
  return weekday !== 'SUN' && window.schoolDays.includes(weekday);
}

export function inWindow(day: CivilDate, window: AssignmentWindow): boolean {
  return day >= window.from && day <= window.to;
}

/** Jour d'école suivant (+1) ou précédent (-1) dans la fenêtre ; null à la borne. */
export function stepSchoolDay(
  day: CivilDate,
  direction: 1 | -1,
  window: AssignmentWindow,
): CivilDate | null {
  for (
    let next = addDays(day, direction);
    inWindow(next, window);
    next = addDays(next, direction)
  ) {
    if (isSchoolDay(next, window)) return next;
  }
  return null;
}

/** Position du jour par rapport à aujourd'hui, en mots ; null au-delà de deux semaines. */
export function relativeDay(day: CivilDate, today: CivilDate): string | null {
  const offset = daysBetween(today, day);
  if (offset === 0) return 'aujourd’hui';
  if (offset === 1) return 'demain';
  if (offset === -1) return 'hier';
  if (offset > 1 && offset < 7) return `dans ${offset} jours`;
  if (offset < -1 && offset > -7) return `il y a ${-offset} jours`;
  if (offset >= 7 && offset < 14) return 'semaine prochaine';
  if (offset <= -7 && offset > -14) return 'semaine passée';
  return null;
}

/**
 * Jour d'ouverture : le jour demandé s'il est dans la fenêtre ; sinon le premier jour, à partir
 * d'aujourd'hui, qui a quelque chose devant le parent ; à défaut, aujourd'hui (ramené dans la
 * fenêtre).
 */
export function openingDay(
  window: AssignmentWindow,
  requested: string | null | undefined,
  upcomingDays: readonly CivilDate[],
): CivilDate {
  if (isCivilDate(requested) && inWindow(requested, window)) return requested;
  const next = [...upcomingDays].sort().find((day) => day >= window.today && inWindow(day, window));
  if (next) return next;
  if (window.today < window.from) return window.from;
  if (window.today > window.to) return window.to;
  return window.today;
}

/** Premier jour après `day` qui porte au moins un élément. */
export function nextBusyDay(day: CivilDate, busyDays: readonly CivilDate[]): CivilDate | null {
  return [...busyDays].sort().find((candidate) => candidate > day) ?? null;
}
