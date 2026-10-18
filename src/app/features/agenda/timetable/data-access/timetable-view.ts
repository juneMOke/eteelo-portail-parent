import { formatDate } from '@angular/common';
import {
  TimetableDay,
  TimetableEvaluation,
  TimetableItem,
  TimetableWeek,
} from '../../../../core/api/timetable.contract';
import { CivilDate, addDays, civilToDate, daysBetween } from '../../../../shared/date/civil-date';
import { countLabel } from '../../../../shared/format/count';
import { relativeWeek } from '../../../../shared/format/relative-week';
import { timeLabel } from '../../../../shared/format/time-labels';
import { durationLabel } from '../../data-access/formats';
import { nearDay, schoolWeekOf } from '../../data-access/school-week';

/**
 * Navigation et libellés de Mon emploi du temps. Aucun calcul métier : blocs, pauses, compteurs
 * et amplitude viennent du serveur ; on choisit seulement quel jour montrer et comment le dire.
 */

/** Un instant lu à l'heure de l'école : son jour civil et son heure `HH:mm`. */
export interface SchoolInstant {
  readonly date: CivilDate;
  readonly time: string;
}

/** L'instant (ISO 8601 ou millisecondes) au fuseau de l'école. */
export function schoolInstant(instant: string | number, timeZone: string): SchoolInstant {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(instant));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    time: `${part('hour')}:${part('minute')}`,
  };
}

/**
 * Jour d'ouverture (spec 04 §4) : aujourd'hui tant que son dernier cours n'est pas fini, sinon le
 * prochain jour de la semaine qui a cours. Null quand la semaine n'en a plus : la façade lit
 * alors la suivante. Une semaine sans aucun cours (non publiée) s'ouvre sur aujourd'hui.
 */
export function openingDay(week: TimetableWeek, at: SchoolInstant): CivilDate | null {
  const { today, days } = week;
  const todayInWeek = days.find((day) => day.date === today);
  if (week.courseCount === 0) return todayInWeek?.date ?? days[0]?.date ?? null;
  if (todayInWeek?.lastEnd && todayInWeek.courseCount > 0 && at.time < todayInWeek.lastEnd) {
    return today;
  }
  return days.find((day) => day.date > today && day.courseCount > 0)?.date ?? null;
}

/**
 * Le jour montré : celui de l'URL s'il est dans la semaine, sinon le dernier jour qui le précède
 * (un samedi demandé dans une semaine sans samedi donne le vendredi), sinon le premier.
 */
export function shownDay(
  week: TimetableWeek,
  requested: CivilDate | undefined,
  opening: CivilDate | null,
): TimetableDay {
  const { days } = week;
  const target = requested ?? opening;
  const before = target ? days.filter((day) => day.date <= target) : [];
  return before.at(-1) ?? days[0];
}

/** Jour voisin, d'un jour d'école à l'autre (vendredi → lundi suivant) ; null à la borne. */
export function stepDay(week: TimetableWeek, day: CivilDate, direction: 1 | -1): CivilDate | null {
  const index = week.days.findIndex((item) => item.date === day);
  const neighbour = week.days[index + direction];
  if (neighbour) return neighbour.date;
  // Hors de la semaine : le lundi suivant, ou le samedi d'avant (ramené au vendredi s'il manque).
  if (direction === 1) {
    const monday = addDays(week.weekStart, 7);
    return monday <= week.window.to ? monday : null;
  }
  const friday = addDays(week.weekStart, -3);
  return friday >= week.window.from ? addDays(week.weekStart, -2) : null;
}

/** Lundi de la semaine voisine ; null hors de l'année scolaire. */
export function stepWeek(week: TimetableWeek, direction: 1 | -1): CivilDate | null {
  const monday = addDays(week.weekStart, 7 * direction);
  const friday = addDays(monday, 4);
  return monday <= week.window.to && friday >= week.window.from ? monday : null;
}

/** Semaine d'école d'aujourd'hui ; le week-end, la suivante. */
export function currentWeekStart(week: TimetableWeek): CivilDate {
  return schoolWeekOf(week.today);
}

function capitalize(label: string): string {
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

function dayOfMonth(day: CivilDate): string {
  const value = civilToDate(day).getUTCDate();
  return value === 1 ? '1er' : String(value);
}

function format(day: CivilDate, pattern: string, locale: string): string {
  return formatDate(civilToDate(day), pattern, locale, 'UTC');
}

/** « Mardi 22 septembre 2026 », « Jeudi 1er octobre 2026 » (C3). */
export function dayTitle(day: CivilDate, locale: string): string {
  return `${capitalize(format(day, 'EEEE', locale))} ${dayOfMonth(day)} ${format(day, 'MMMM y', locale)}`;
}

/** « Lun » et « 22 » : une pastille de la bande des jours (C6). */
export function stripDay(day: CivilDate, locale: string): { weekday: string; number: string } {
  return {
    weekday: capitalize(format(day, 'EEE', locale).replace('.', '')),
    number: format(day, 'dd', locale),
  };
}

/** « Lundi » et « 22 sept. » : la tête d'une colonne de la vue semaine (F1). */
export function columnHead(day: CivilDate, locale: string): { weekday: string; date: string } {
  return {
    weekday: capitalize(format(day, 'EEEE', locale)),
    date: `${dayOfMonth(day)} ${format(day, 'MMM', locale)}`,
  };
}

/** « lundi 05/10 » : le prochain jour d'école (H1), la prise d'effet d'un horaire (H5). */
export function shortDayLabel(day: CivilDate, locale: string): string {
  return format(day, 'EEEE dd/MM', locale);
}

/** « 7 h 30 à 11 h 45 ». */
export function rangeLabel(start: string, end: string): string {
  return `${timeLabel(start)} à ${timeLabel(end)}`;
}

/** Ce que la carte du jour montre à la place des créneaux, ou `courses`. */
export type DayContent = 'closed' | 'unpublished' | 'empty' | 'courses';

export function dayContent(day: TimetableDay): DayContent {
  if (day.state === 'WEEKEND' || day.state === 'HOLIDAY') return 'closed';
  if (day.state === 'NOT_PUBLISHED') return 'unpublished';
  return day.items.length ? 'courses' : 'empty';
}

/** « Aujourd'hui · 5 cours · 7 h 30 à 11 h 45 · 1 épreuve » (C4) ; « Pas d'école » un jour fermé. */
export function daySummary(day: TimetableDay, today: CivilDate): string {
  const near = nearDay(day.date, today);
  const content = dayContent(day);
  const parts: (string | null)[] = [near ? capitalize(near) : null];
  if (content === 'closed') parts.push('Pas d’école');
  else if (content === 'empty') parts.push('Aucun cours');
  else if (content === 'courses' && day.courseCount > 0) {
    parts.push(`${day.courseCount} cours`);
    if (day.firstStart && day.lastEnd) parts.push(rangeLabel(day.firstStart, day.lastEnd));
    if (day.examCount > 0) parts.push(countLabel(day.examCount, 'épreuve', 'épreuves', ''));
  }
  return parts.filter(Boolean).join(' · ');
}

/** « Cette semaine · 28 cours » (C4, vue semaine). */
export function weekSummary(week: TimetableWeek): string {
  const offset = Math.round(daysBetween(currentWeekStart(week), week.weekStart) / 7);
  const parts = [capitalize(relativeWeek(offset).long)];
  if (week.courseCount > 0) parts.push(`${week.courseCount} cours`);
  return parts.join(' · ');
}

/** « Examen · 2 h », « Interrogation · 45 min » (D11, F4). */
export function evaluationLabel(evaluation: TimetableEvaluation): string {
  const kind = evaluation.type === 'EXAMEN' ? 'Examen' : 'Interrogation';
  const duration = durationLabel(evaluation.durationMinutes);
  return duration ? `${kind} · ${duration}` : kind;
}

/** Le créneau en cours, aujourd'hui seulement : début compris, fin exclue. */
export function isNow(item: TimetableItem, day: CivilDate, now: SchoolInstant | null): boolean {
  return !!now && now.date === day && item.start <= now.time && now.time < item.end;
}
