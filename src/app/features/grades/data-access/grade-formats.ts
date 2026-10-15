import { formatDate, formatNumber } from '@angular/common';
import {
  Evolution,
  GradeCounts,
  Rank,
  TermSelection,
  TermTree,
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

function plural(count: number, one: string, many: string): string {
  return `${count} ${count > 1 ? many : one}`;
}

/** « 6 évaluations · 4 notées · 2 en attente » ; « Aucune évaluation ». */
export function weekSummary({ total, graded, pending }: GradeCounts): string {
  if (total === 0) return 'Aucune évaluation';
  const parts = [plural(total, 'évaluation', 'évaluations'), plural(graded, 'notée', 'notées')];
  if (pending > 0) parts.push(`${pending} en attente`);
  return parts.join(' · ');
}

/** « Lundi 22/09 » : en-tête de jour et date d'une évaluation. */
export function dayLabel(day: CivilDate, locale: string): string {
  const label = formatDate(civilToDate(day), 'EEEE dd/MM', locale, 'UTC');
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

/** « Lundi 22 septembre » : la même date, pour un lecteur d'écran. */
export function spokenDay(day: CivilDate, locale: string): string {
  const label = formatDate(civilToDate(day), 'EEEE d MMMM', locale, 'UTC');
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

/** « 8e sur 32 », « 1er sur 32 ». */
export function rankLabel({ position, classSize }: Rank): string {
  return `${position === 1 ? '1er' : `${position}e`} sur ${classSize}`;
}

/** « +0,8 pt par rapport à la 1re période ». */
export function evolutionLabel({ delta, comparedToLabel }: Evolution, locale: string): string {
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  return `${sign}${formatNumber(Math.abs(delta), locale, '1.1-1')} pt par rapport à ${comparedToLabel}`;
}

/** « la 2e période du 1er trimestre », « l’examen du 1er trimestre », « le 1er trimestre ». */
export function selectionPhrase({ terms, selection }: TermTree): string {
  const term = terms.find((candidate) => candidate.termId === selection.termId);
  const period = term?.periods.find((candidate) => candidate.periodId === selection.periodId);
  if (!term) return selection.label;
  if (!period) return `le ${term.label}`;
  const name = period.kind === 'EXAM' ? `l’${period.label.toLowerCase()}` : `la ${period.label}`;
  return `${name} du ${term.label}`;
}

/** Annonce d'un changement de sélection : « 1er trimestre, 2e période, 5 cours. » */
export function selectionAnnouncement(selection: TermSelection, courseCount: number): string {
  return `${selection.label.replace(' · ', ', ')}, ${courseCount} cours.`;
}
