import { formatDate } from '@angular/common';
import {
  ChildDiscipline,
  DisciplineCase,
  LinkedCase,
  Sanction,
  Severity,
} from '../../../core/api/conduct.contract';
import { civilToDate } from '../../../shared/date/civil-date';
import { countLabel } from '../../../shared/format/count';
import { dayLabel, spokenDay } from '../../../shared/format/day-labels';
import { Tone } from '../../../shared/ui/tone';

/**
 * Mise en forme de Ma discipline (spec 06 §4 et §6). Gravité et sanction sont deux champs
 * saisis par l'école, servis bruts (arbitrage 5) : la pastille suit la gravité, « Suite donnée »
 * suit la sanction. Rien n'est déduit du texte libre.
 */

export interface SeverityView {
  /** Mot de la pastille ; en attente de validation par l'école. */
  readonly label: string;
  readonly tone: Tone;
  /** Pour le bilan : « 2 faits mineurs ». */
  readonly one: string;
  readonly many: string;
  readonly none: string;
}

const SEVERITIES: Readonly<Record<'MINOR' | 'MAJOR' | 'SERIOUS', SeverityView>> = {
  MINOR: {
    label: 'Mineur',
    tone: 'info',
    one: 'fait mineur',
    many: 'faits mineurs',
    none: 'aucun fait mineur',
  },
  MAJOR: {
    label: 'Majeur',
    tone: 'pending',
    one: 'fait majeur',
    many: 'faits majeurs',
    none: 'aucun fait majeur',
  },
  SERIOUS: {
    label: 'Grave',
    tone: 'alert',
    one: 'fait grave',
    many: 'faits graves',
    none: 'aucun fait grave',
  },
};

/** Une gravité inconnue reste neutre, sans mot inventé. */
export function severityView(severity: Severity): SeverityView | null {
  return SEVERITIES[severity as keyof typeof SEVERITIES] ?? null;
}

/** « 2 faits mineurs · 1 fait majeur · aucun fait grave ». */
export function disciplineSummary({ summary }: ChildDiscipline): string {
  return [
    countLabel(summary.minor, SEVERITIES.MINOR.one, SEVERITIES.MINOR.many, SEVERITIES.MINOR.none),
    countLabel(summary.major, SEVERITIES.MAJOR.one, SEVERITIES.MAJOR.many, SEVERITIES.MAJOR.none),
    countLabel(
      summary.serious,
      SEVERITIES.SERIOUS.one,
      SEVERITIES.SERIOUS.many,
      SEVERITIES.SERIOUS.none,
    ),
  ].join(' · ');
}

/**
 * Libellé de l'école pour la suite donnée. La convocation des parents n'est pas une suite :
 * c'est une demande faite au parent (encadré ⑨).
 */
const SANCTIONS: Readonly<Record<string, string>> = {
  ORAL_WARNING: 'Avertissement oral',
  WRITTEN_WARNING: 'Avertissement écrit',
  DETENTION: 'Retenue',
  TEMPORARY_EXCLUSION: 'Exclusion temporaire',
  DISCIPLINARY_COUNCIL: 'Conseil de discipline',
  PERMANENT_EXCLUSION: 'Exclusion définitive',
};

export function sanctionLabel(sanction: Sanction | null): string | null {
  return (sanction && SANCTIONS[sanction]) || null;
}

/** Lien de la fiche du jour vers le fait : « Suite : avertissement écrit ». */
export function followUpLabel(linked: LinkedCase): string {
  const sanction = sanctionLabel(linked.sanction);
  if (sanction) return `Suite : ${sanction.toLowerCase()}`;
  return linked.sanction === 'PARENTS_SUMMONED'
    ? 'Suite : entretien demandé'
    : 'Suite : fait consigné';
}

/** « Mardi 16/09 · consigné par Paul Kalala ». */
export function caseMeta(item: DisciplineCase, locale: string): string {
  const day = dayLabel(item.date, locale);
  return item.recordedBy ? `${day} · consigné par ${item.recordedBy}` : day;
}

/** « Mis à jour le 22/09 » ; null si le fait n'a pas changé. */
export function revisedLabel(item: DisciplineCase, locale: string): string | null {
  return item.revisedAt ? `Mis à jour le ${formatDate(item.revisedAt, 'dd/MM', locale)}` : null;
}

/** Le lien vers Ma présence : « Voir l’absence du 16 septembre », « Voir les retards de septembre ». */
export function linkedAttendanceLabel(item: DisciplineCase, locale: string): string | null {
  const link = item.linkedAttendance;
  if (!link) return null;
  const date = civilToDate(link.date);
  if (link.kind === 'MONTH')
    return `Voir les retards de ${formatDate(date, 'MMMM', locale, 'UTC')}`;
  const day = formatDate(date, 'd MMMM', locale, 'UTC');
  return item.category === 'UNJUSTIFIED_ABSENCE'
    ? `Voir l’absence du ${day}`
    : `Voir le retard du ${day}`;
}

/** Nom lu de la carte : « Majeur, mardi 16 septembre : Absence non justifiée. Suite donnée : avertissement écrit. » */
export function spokenCase(item: DisciplineCase, locale: string): string {
  const severity = severityView(item.severity)?.label;
  const day = spokenDay(item.date, locale).toLowerCase();
  const sanction = sanctionLabel(item.sanction);
  return [
    `${severity ? `${severity}, ` : ''}${day} : ${item.title}.`,
    sanction ? `Suite donnée : ${sanction.toLowerCase()}.` : '',
  ]
    .join(' ')
    .trim();
}
