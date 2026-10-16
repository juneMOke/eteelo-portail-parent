import { formatDate } from '@angular/common';
import { CivilDate } from '../date/civil-date';

/**
 * Heures et jours d'un instant UTC, lus au fuseau du téléphone (celui de l'école) : l'heure
 * d'un appel, d'un versement, d'une date de situation.
 */

/** « 7 h 52 », depuis `HH:mm`. */
export function timeLabel(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${Number(hours)} h ${minutes}`;
}

/** « 8 h », « 18 h 30 » : une heure ronde sans ses minutes (heure limite, créneau). */
export function hourLabel(time: string): string {
  const [hours, minutes] = time.split(':');
  return minutes === '00' ? `${Number(hours)} h` : `${Number(hours)} h ${minutes}`;
}

/** « 7 h 40 » : l'heure d'un instant. */
export function instantTime(instant: string, locale: string): string {
  return timeLabel(formatDate(instant, 'HH:mm', locale));
}

/** Le jour civil d'un instant, à passer aux libellés de jour (`dayLabel`, `shortDate`…). */
export function instantDay(instant: string, locale: string): CivilDate {
  return formatDate(instant, 'yyyy-MM-dd', locale);
}
