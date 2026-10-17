import { formatDate } from '@angular/common';
import { CivilDate, CivilMonth, civilToDate, firstDayOf } from '../date/civil-date';

/** Libellés de dates civiles de l'école, formatés en UTC pour ne jamais glisser d'un jour. */

function capitalize(label: string): string {
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

/** « Lundi 22/09 » : en-tête de jour, date d'une ligne. */
export function dayLabel(day: CivilDate, locale: string): string {
  return capitalize(formatDate(civilToDate(day), 'EEEE dd/MM', locale, 'UTC'));
}

/** « Lun. 22/09 » : la même date, là où la place manque (une ligne au téléphone). */
export function compactDayLabel(day: CivilDate, locale: string): string {
  return capitalize(formatDate(civilToDate(day), 'EEE dd/MM', locale, 'UTC'));
}

/** « Lundi 22 septembre » : la même date, pour un lecteur d'écran. */
export function spokenDay(day: CivilDate, locale: string): string {
  return capitalize(formatDate(civilToDate(day), 'EEEE d MMMM', locale, 'UTC'));
}

/** « 22/09 » : une date dans une phrase (« avant le 30/09 »). */
export function shortDate(day: CivilDate, locale: string): string {
  return formatDate(civilToDate(day), 'dd/MM', locale, 'UTC');
}

/** « Septembre 2026 ». */
export function monthLabel(month: CivilMonth, locale: string): string {
  return capitalize(formatDate(civilToDate(firstDayOf(month)), 'MMMM y', locale, 'UTC'));
}
