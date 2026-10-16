import { formatDate } from '@angular/common';
import {
  AttendanceDay,
  AttendanceRange,
  ChildAttendance,
} from '../../../core/api/conduct.contract';
import {
  CivilDate,
  CivilMonth,
  addDays,
  civilToDate,
  daysBetween,
  daysOf,
  firstDayOf,
  isCivilDate,
  isCivilMonth,
  mondayOf,
  monthOf,
} from '../../../shared/date/civil-date';
import { monthLabel, spokenDay } from '../../../shared/format/day-labels';
import { relativeWeek } from '../../../shared/format/relative-week';
import { shortWeekLabel, weekLabel } from '../../../shared/format/week-labels';
import { relativeMonth, tileDayLabel } from './attendance-formats';
import { DAY_STATES, DayState, dayState, spokenState } from './day-state';

/**
 * Ce que montre Ma présence pour une semaine et pour un mois : les tuiles, la grille, la liste,
 * le bandeau. Rangement et filtrage des jours que rend le serveur ; aucun compte ni taux n'est
 * calculé ici.
 */

/** Bornes du navigateur : du mois de la rentrée au mois en cours. */
export interface MonthBounds {
  readonly first: CivilMonth;
  readonly last: CivilMonth;
}

export function monthBounds(attendance: ChildAttendance): MonthBounds {
  return { first: monthOf(attendance.from), last: monthOf(attendance.to) };
}

/** Le mois affiché : celui de l'URL, sinon celui du jour ciblé, sinon le mois en cours. */
export function selectedMonth(
  bounds: MonthBounds,
  month: string | undefined,
  date: string | undefined,
): CivilMonth {
  const wanted = isCivilMonth(month) ? month : isCivilDate(date) ? monthOf(date) : bounds.last;
  return wanted < bounds.first ? bounds.first : wanted > bounds.last ? bounds.last : wanted;
}

export function daysByDate(days: readonly AttendanceDay[]): ReadonlyMap<CivilDate, AttendanceDay> {
  return new Map(days.map((day) => [day.date, day]));
}

/** État d'une cellule : un jour appelé, ou rien (pas d'école, appel pas fait, jour à venir). */
export type CellState = DayState | 'none';

export interface CalendarCell {
  readonly date: CivilDate;
  readonly dayOfMonth: number;
  readonly state: CellState;
  readonly today: boolean;
  /** Une cellule autre que « présent » ou vide s'ouvre sur sa fiche ; aujourd'hui aussi. */
  readonly openable: boolean;
}

/** Semaines du lundi au dimanche ; null avant le 1er et après le dernier jour du mois. */
export function calendarWeeks(
  month: CivilMonth,
  byDate: ReadonlyMap<CivilDate, AttendanceDay>,
  today: CivilDate,
): (CalendarCell | null)[][] {
  const cells: (CalendarCell | null)[] = [];
  const days = daysOf(month);
  const offset = (civilToDate(days[0]).getUTCDay() + 6) % 7;
  for (let i = 0; i < offset; i++) cells.push(null);
  for (const date of days) {
    const day = byDate.get(date);
    const state: CellState = day ? dayState(day) : 'none';
    cells.push({
      date,
      dayOfMonth: Number(date.slice(8)),
      state,
      today: date === today,
      openable: (state !== 'present' && state !== 'none') || date === today,
    });
  }
  while (cells.length % 7) cells.push(null);
  const weeks: (CalendarCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** États présents dans le mois, dans l'ordre de la légende. */
export function legendStates(days: readonly AttendanceDay[]): DayState[] {
  const order: DayState[] = ['present', 'late', 'excused', 'pending', 'unexcused'];
  const found = new Set(days.map(dayState));
  return order.filter((state) => found.has(state));
}

export function daysOfMonth(days: readonly AttendanceDay[], month: CivilMonth): AttendanceDay[] {
  return days.filter((day) => monthOf(day.date) === month);
}

/** ⑤ Les jours non « présent » du mois, le plus récent en haut. */
export function absencesAndLates(days: readonly AttendanceDay[]): AttendanceDay[] {
  return days.filter((day) => dayState(day) !== 'present').reverse();
}

/** Une ligne du bandeau ② : une absence à justifier, ou une justification en attente. */
export interface PendingAbsence {
  readonly date: CivilDate;
  /** Null : justification envoyée, en attente de l'école. */
  readonly justifyUntil: CivilDate | null;
  readonly day: AttendanceDay | undefined;
}

/**
 * ② Ce qui attend le parent : les absences à justifier que rend le serveur, puis celles déjà
 * justifiées en attente de l'école (elles restent visibles jusqu'à la décision). La plus
 * ancienne en premier : son délai court le plus.
 */
export function pendingAbsences(attendance: ChildAttendance): PendingAbsence[] {
  const byDate = daysByDate(attendance.days);
  const isPending = (day: AttendanceDay | undefined) => day?.justification?.status === 'PENDING';
  const toJustify = attendance.toJustify.map(({ date, justifyUntil }) => {
    const day = byDate.get(date);
    return { date, justifyUntil: isPending(day) ? null : justifyUntil, day };
  });
  const listed = new Set(toJustify.map((entry) => entry.date));
  const waiting = attendance.days
    .filter((day) => isPending(day) && !listed.has(day.date))
    .map((day) => ({ date: day.date, justifyUntil: null, day }));
  return [...toJustify, ...waiting].sort((a, b) => a.date.localeCompare(b.date));
}

/** Tout ce que la page montre pour le mois choisi, lu dans la réponse de l'année. */
export function monthView(
  attendance: ChildAttendance,
  monthParam: string | undefined,
  dateParam: string | undefined,
  locale: string,
) {
  const bounds = monthBounds(attendance);
  const month = selectedMonth(bounds, monthParam, dateParam);
  const days = daysOfMonth(attendance.days, month);
  const byDate = daysByDate(attendance.days);
  return {
    bounds,
    month,
    byDate,
    today: attendance.to,
    counts: attendance.months.find((candidate) => candidate.month === month),
    /** « Septembre 2026 », « septembre ». */
    caption: monthLabel(month, locale),
    monthName: formatDate(civilToDate(firstDayOf(month)), 'MMMM', locale, 'UTC'),
    weeks: calendarWeeks(month, byDate, attendance.to),
    legend: legendStates(days),
    list: absencesAndLates(days),
    pending: pendingAbsences(attendance),
    relative: relativeMonth(monthsBetween(month, bounds.last)),
    /** « mardi 1 septembre » : premier jour de l'année, pour l'état vide. */
    firstDayLabel: spokenDay(attendance.from, locale).toLowerCase(),
    empty: attendance.days.length === 0,
  };
}

/** Écart en mois, négatif dans le passé : « il y a 2 mois ». */
function monthsBetween(month: CivilMonth, current: CivilMonth): number {
  const index = (value: CivilMonth) => Number(value.slice(0, 4)) * 12 + Number(value.slice(5, 7));
  return index(month) - index(current);
}

/** Bornes du bandeau de semaine, en lundis : de la semaine de la rentrée à la semaine en cours. */
export interface WeekBounds {
  readonly first: CivilDate;
  readonly last: CivilDate;
}

export function weekBounds(attendance: ChildAttendance): WeekBounds {
  return { first: mondayOf(attendance.from), last: mondayOf(attendance.to) };
}

/** Le lundi de la semaine affichée : celle de l'URL, sinon celle du jour ciblé, sinon l'actuelle. */
export function selectedWeek(
  bounds: WeekBounds,
  week: string | undefined,
  date: string | undefined,
): CivilDate {
  const wanted = isCivilDate(week)
    ? mondayOf(week)
    : isCivilDate(date)
      ? mondayOf(date)
      : bounds.last;
  return wanted < bounds.first ? bounds.first : wanted > bounds.last ? bounds.last : wanted;
}

/**
 * État d'une tuile de la semaine : un jour appelé ; sinon pas d'école (jour passé sans appel),
 * appel pas encore fait (aujourd'hui) ou jour à venir, laissé blanc et sans mot.
 */
export type WeekTileState = DayState | 'off' | 'not-yet' | 'upcoming';

export interface WeekTile {
  readonly date: CivilDate;
  readonly state: WeekTileState;
  /** « lun 22 sept. », en petites capitales à l'écran. */
  readonly label: string;
  /** L'état en mot ; null pour un jour à venir. */
  readonly word: string | null;
  /** « Lundi 22 septembre, présent ». */
  readonly name: string;
}

const TILE_WORDS: Readonly<Record<'off' | 'not-yet' | 'upcoming', string | null>> = {
  off: 'Pas d’école',
  'not-yet': 'Pas encore enregistrée',
  upcoming: null,
};

/** Du lundi au vendredi ; le samedi et le dimanche seulement s'ils ont été appelés. */
export function weekTiles(
  monday: CivilDate,
  byDate: ReadonlyMap<CivilDate, AttendanceDay>,
  today: CivilDate,
  locale: string,
): WeekTile[] {
  const tiles: WeekTile[] = [];
  for (let offset = 0; offset < 7; offset++) {
    const date = addDays(monday, offset);
    const day = byDate.get(date);
    if (offset >= 5 && !day) continue;
    const state: WeekTileState = day
      ? dayState(day)
      : date > today
        ? 'upcoming'
        : date === today
          ? 'not-yet'
          : 'off';
    const word = day
      ? DAY_STATES[state as DayState].label
      : TILE_WORDS[state as keyof typeof TILE_WORDS];
    const spoken = day ? spokenState(state as DayState) : (word ?? 'à venir').toLowerCase();
    tiles.push({
      date,
      state,
      label: tileDayLabel(date, locale),
      word,
      name: `${spokenDay(date, locale)}, ${spoken}`,
    });
  }
  return tiles;
}

/** La plage demandée au serveur pour le résumé de la semaine, ramenée dans l'année montrée. */
export function weekRange(monday: CivilDate, attendance: ChildAttendance): AttendanceRange {
  const sunday = addDays(monday, 6);
  return {
    from: monday < attendance.from ? attendance.from : monday,
    to: sunday > attendance.to ? attendance.to : sunday,
  };
}

/** Tout ce que la section « La semaine » montre, lu dans la réponse de l'année. */
export function weekView(
  attendance: ChildAttendance,
  weekParam: string | undefined,
  dateParam: string | undefined,
  locale: string,
) {
  const bounds = weekBounds(attendance);
  const monday = selectedWeek(bounds, weekParam, dateParam);
  const tiles = weekTiles(monday, daysByDate(attendance.days), attendance.to, locale);
  const last = tiles.at(-1)?.date ?? addDays(monday, 4);
  return {
    bounds,
    monday,
    tiles,
    range: weekRange(monday, attendance),
    /** « Semaine du 22 au 26 septembre », « 22 – 26 sept. ». */
    label: weekLabel(monday, last, locale),
    shortLabel: shortWeekLabel(monday, last, locale),
    relative: relativeWeek(Math.round(daysBetween(bounds.last, monday) / 7)),
  };
}
