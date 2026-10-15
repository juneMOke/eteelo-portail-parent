import { AssignmentStatus } from '../../../core/api/assignments.contract';
import { IconName } from '../../../shared/ui/icon/icons';
import { Tone } from '../../../shared/ui/tone';

export interface StatusView {
  /** Le mot du statut, toujours affiché : la couleur ne porte jamais seule le sens. */
  readonly label: string;
  /** Or (à faire), bleu (info), vert (corrigé), terre cuite (il manque quelque chose). */
  readonly tone: Tone;
  readonly icon: IconName;
}

const STATUSES: Readonly<Record<string, StatusView>> = {
  UPCOMING: { label: 'À venir', tone: 'pending', icon: 'clock' },
  DUE: { label: 'À rendre', tone: 'pending', icon: 'clock' },
  SUBMITTED: { label: 'Rendu', tone: 'info', icon: 'file-text' },
  AWAITING_GRADE: { label: 'En attente de correction', tone: 'info', icon: 'clipboard-check' },
  GRADED: { label: 'Corrigé', tone: 'success', icon: 'award' },
  ABSENT: { label: 'Absent à l’épreuve', tone: 'alert', icon: 'alert-circle' },
  MISSED: { label: 'Non rendu', tone: 'alert', icon: 'alert-circle' },
};

const UNKNOWN: StatusView = { label: 'Statut non précisé', tone: 'neutral', icon: 'info' };

/** Présentation du statut rendu par le serveur ; une valeur inconnue reste neutre. */
export function statusView(status: AssignmentStatus): StatusView {
  return STATUSES[status] ?? UNKNOWN;
}
