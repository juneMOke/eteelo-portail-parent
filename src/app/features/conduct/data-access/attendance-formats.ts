import { formatDate, formatPercent } from '@angular/common';
import {
  AbsenceJustification,
  AbsenceReason,
  AttendanceDay,
  AttendanceMonth,
  AttendanceSummary,
  JustificationReason,
} from '../../../core/api/conduct.contract';
import { CivilDate } from '../../../shared/date/civil-date';
import { countLabel } from '../../../shared/format/count';
import { shortDate } from '../../../shared/format/day-labels';

/** Mise en forme de Ma présence (spec 06 §6) ; tous les chiffres viennent du serveur. */

/** « 95 % » : le taux de présence, un seul chiffre, sans complément d'absence. */
export function rateLabel(rate: number, locale: string): string {
  return formatPercent(rate, locale, '1.0-0');
}

/** « 58 jours sur 61 ». */
export function presenceDaysLabel({ presentDays, schoolDays }: AttendanceSummary): string {
  return `${presentDays} ${presentDays > 1 ? 'jours' : 'jour'} sur ${schoolDays}`;
}

/** « 21 jours d’école · 1 absence · 2 retards ». */
export function monthSummary(month: AttendanceMonth | undefined): string {
  if (!month?.calledDays) return 'Aucun jour d’école enregistré';
  return [
    countLabel(month.calledDays, 'jour d’école', 'jours d’école', ''),
    countLabel(month.absences, 'absence', 'absences', 'aucune absence'),
    countLabel(month.lates, 'retard', 'retards', 'aucun retard'),
  ].join(' · ');
}

/** « 7 h 52 », depuis `HH:mm`. */
export function timeLabel(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${Number(hours)} h ${minutes}`;
}

/** « 7 h 40 » : l'heure d'un instant, au fuseau du téléphone (celui de l'école). */
function instantTime(instant: string, locale: string): string {
  return timeLabel(formatDate(instant, 'HH:mm', locale));
}

/** Le moment du jour : l'heure d'arrivée d'un retard, sinon la journée (appel à la journée). */
export function momentLabel(day: AttendanceDay): string {
  return day.status === 'LATE' && day.arrivalTime
    ? `Arrivé à ${timeLabel(day.arrivalTime)}`
    : 'Journée';
}

/** « Enregistré par Jean Ilunga à 7 h 40 » ; null si l'école n'a rien dit de l'appel. */
export function recordedLabel(day: AttendanceDay, locale: string): string | null {
  if (!day.recordedBy && !day.recordedAt) return null;
  const by = day.recordedBy ? ` par ${day.recordedBy}` : '';
  const at = day.recordedAt ? ` à ${instantTime(day.recordedAt, locale)}` : '';
  return `Enregistré${by}${at}`;
}

const REASONS: Readonly<Record<string, string>> = {
  SICKNESS: 'Maladie',
  FAMILY_EMERGENCY: 'Raison familiale',
  PERSONAL: 'Raison personnelle',
  MEDICAL_APPOINTMENT: 'Rendez-vous médical',
  TRANSPORT: 'Transport',
  BEREAVEMENT: 'Deuil',
  BAD_WEATHER: 'Intempéries',
  VACATION: 'Vacances',
  OTHER: 'Autre',
};

/** Les motifs qu'un parent peut donner, dans l'ordre de la feuille. */
export const JUSTIFICATION_REASONS: readonly { id: JustificationReason; label: string }[] = [
  { id: 'SICKNESS', label: REASONS['SICKNESS'] },
  { id: 'FAMILY_EMERGENCY', label: REASONS['FAMILY_EMERGENCY'] },
  { id: 'TRANSPORT', label: REASONS['TRANSPORT'] },
  { id: 'OTHER', label: REASONS['OTHER'] },
];

/** « Maladie — Certificat reçu le 10/09 » ; null sans motif retenu par l'école. */
export function reasonLabel(reason: AbsenceReason | null, note: string | null): string | null {
  const label = reason ? REASONS[reason] : undefined;
  if (!label) return note;
  return note ? `${label} — ${note}` : label;
}

/** « À justifier jusqu’au 30/09 » : le dernier jour compte. */
export function deadlineLabel(until: CivilDate, locale: string): string {
  return `À justifier jusqu’au ${shortDate(until, locale)}`;
}

function instantDate(instant: string, locale: string): string {
  return formatDate(instant, 'dd/MM', locale);
}

/** Où en est la justification envoyée par le parent. */
export function justificationLabel(justification: AbsenceJustification, locale: string): string {
  switch (justification.status) {
    case 'PENDING':
      return `Justification envoyée le ${instantDate(justification.submittedAt, locale)} · en attente de l’école`;
    case 'REJECTED':
      return `Justification non retenue${decided(justification, locale)}`;
    case 'ACCEPTED':
      return `Justification acceptée${decided(justification, locale)}`;
    default:
      return `Justification envoyée le ${instantDate(justification.submittedAt, locale)}`;
  }
}

function decided({ decidedAt }: AbsenceJustification, locale: string): string {
  return decidedAt ? ` le ${instantDate(decidedAt, locale)}` : '';
}
