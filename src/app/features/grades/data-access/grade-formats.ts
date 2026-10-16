import { formatDate, formatNumber } from '@angular/common';
import {
  Evolution,
  GradePeriod,
  GradeSelection,
  GradeSummary,
  Rank,
} from '../../../core/api/grades.contract';
import { CivilDate, civilToDate } from '../../../shared/date/civil-date';

/** Mise en forme des chiffres de Mes notes (spec 05 §6) ; aucun calcul métier. */

/** Une moyenne, toujours en pourcentage et à une décimale : « 64,5 % ». */
export function percentLabel(percent: number, locale: string): string {
  return `${formatNumber(percent, locale, '1.1-1')} %`;
}

/** Une note sur son barème : « 7,5/10 ». */
export function pointsLabel(points: number, maxPoints: number, locale: string): string {
  const format = (value: number) => formatNumber(value, locale, '1.0-2');
  return `${format(points)}/${format(maxPoints)}`;
}

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

/** « Lun. 22 sept. » : une date de la frise d'une carte de résultat. */
export function shortDayLabel(day: CivilDate, locale: string): string {
  const label = formatDate(civilToDate(day), 'EEE d MMM', locale, 'UTC');
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

/** Initiale capitale : « les acides » devient « Les acides ». */
export function capitalized(text: string): string {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count > 1 ? many : one}`;
}

/** « 6 évaluations · 4 notées · 2 en attente » ; « Aucune évaluation ». */
export function weekSummary({ total, graded, pending }: GradeSummary): string {
  if (total === 0) return 'Aucune évaluation';
  const parts = [plural(total, 'évaluation', 'évaluations'), plural(graded, 'notée', 'notées')];
  if (pending > 0) parts.push(`${pending} en attente`);
  return parts.join(' · ');
}

/** « 8e sur 32 », « 1er sur 32 ». */
export function rankLabel({ position, of }: Rank): string {
  return `${position === 1 ? '1er' : `${position}e`} sur ${of}`;
}

/** « +0,8 pt par rapport au 1er trimestre · 1re période ». */
export function evolutionLabel({ points, versus }: Evolution, locale: string): string {
  const sign = points > 0 ? '+' : points < 0 ? '−' : '';
  return `${sign}${formatNumber(Math.abs(points), locale, '1.1-1')} pt par rapport au ${versus}`;
}

/** « la 2e période du 1er trimestre », « l’examen du 1er trimestre », « le 1er trimestre ». */
export function selectionPhrase(
  periods: readonly GradePeriod[],
  selection: GradeSelection,
): string {
  const period = periods.find((candidate) => candidate.periodId === selection.periodId);
  if (!period) return selection.label;
  if (selection.part === 'ALL') return `le ${period.label}`;
  const part = period.parts.find((candidate) => candidate.part === selection.part);
  if (!part) return selection.label;
  const name = part.part === 'EXAM' ? `l’${part.label.toLowerCase()}` : `la ${part.label}`;
  return `${name} du ${period.label}`;
}

/** « trimestre » ou « semestre », dernier mot du libellé du serveur (« 1er trimestre »). */
export function periodUnit(periods: readonly GradePeriod[]): string {
  return periods[0]?.label.split(' ').at(-1) ?? 'trimestre';
}

/** Annonce d'un changement de sélection : « 1er trimestre, 2e période, 5 cours. » */
export function selectionAnnouncement(selection: GradeSelection, courseCount: number): string {
  return `${selection.label.replace(' · ', ', ')}, ${courseCount} cours.`;
}
