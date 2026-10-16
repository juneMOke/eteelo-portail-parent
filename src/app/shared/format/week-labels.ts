import { formatDate } from '@angular/common';
import { CivilDate, civilToDate } from '../date/civil-date';

/** Intitulés d'une semaine d'école, du lundi au dernier jour montré. */

/** « 1er » pour le premier du mois, le nombre sinon. */
function dayOfMonth(day: CivilDate): string {
  const date = civilToDate(day).getUTCDate();
  return date === 1 ? '1er' : String(date);
}

/** « Semaine du 21 au 25 septembre », « Semaine du 29 septembre au 2 octobre ». */
export function weekLabel(from: CivilDate, to: CivilDate, locale: string): string {
  const month = (day: CivilDate) => formatDate(civilToDate(day), 'MMMM', locale, 'UTC');
  const start =
    from.slice(0, 7) === to.slice(0, 7) ? dayOfMonth(from) : `${dayOfMonth(from)} ${month(from)}`;
  return `Semaine du ${start} au ${dayOfMonth(to)} ${month(to)}`;
}

/** « 21 – 26 sept. », « 28 sept. – 3 oct. » : l'intitulé court du téléphone. */
export function shortWeekLabel(from: CivilDate, to: CivilDate, locale: string): string {
  const month = (day: CivilDate) => formatDate(civilToDate(day), 'MMM', locale, 'UTC');
  const end = `${dayOfMonth(to)} ${month(to)}`;
  if (from.slice(0, 7) === to.slice(0, 7)) return `${dayOfMonth(from)} – ${end}`;
  return `${dayOfMonth(from)} ${month(from)} – ${end}`;
}
