import { CivilDate } from '../date/civil-date';
import { timeLabel } from './time-labels';

/**
 * Jour et heure d'un instant UTC lus à un fuseau IANA donné (celui de l'école, `school.timeZone`)
 * plutôt qu'à celui du téléphone. Un fuseau inconnu du navigateur retombe sur celui du téléphone.
 */

const formats = new Map<string, Intl.DateTimeFormat>();

function format(timeZone: string): Intl.DateTimeFormat {
  let known = formats.get(timeZone);
  if (!known) {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    };
    try {
      known = new Intl.DateTimeFormat('en-CA', { ...options, timeZone });
    } catch {
      known = new Intl.DateTimeFormat('en-CA', options);
    }
    formats.set(timeZone, known);
  }
  return known;
}

function parts(instant: string | Date, timeZone: string): Record<string, string> {
  return Object.fromEntries(
    format(timeZone)
      .formatToParts(new Date(instant))
      .map((part) => [part.type, part.value]),
  );
}

/** Le jour civil de l'instant à ce fuseau, à passer aux libellés de jour (`dayLabel`…). */
export function zonedDay(instant: string | Date, timeZone: string): CivilDate {
  const { year, month, day } = parts(instant, timeZone);
  return `${year}-${month}-${day}`;
}

/** « 9 h 30 » : l'heure de l'instant à ce fuseau. */
export function zonedTime(instant: string | Date, timeZone: string): string {
  const { hour, minute } = parts(instant, timeZone);
  return timeLabel(`${hour}:${minute}`);
}
