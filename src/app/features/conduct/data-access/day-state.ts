import { AttendanceDay } from '../../../core/api/conduct.contract';
import { Tone } from '../../../shared/ui/tone';

/**
 * Les états d'un jour (spec 06 §4) : un vocabulaire fermé, un mot par état, une couleur qui le
 * confirme et un glyphe pour ne jamais laisser la couleur seule. Lus sur ce que rend le
 * serveur, sans rien recalculer.
 */
export type DayState = 'present' | 'late' | 'excused' | 'pending' | 'unexcused' | 'unknown';

export interface DayStateView {
  /** « Absent · non justifié ». */
  readonly label: string;
  readonly tone: Tone;
  /** Point pour un retard, trait pour une absence. */
  readonly glyph: 'dot' | 'dash' | null;
}

export const DAY_STATES: Readonly<Record<DayState, DayStateView>> = {
  present: { label: 'Présent', tone: 'success', glyph: null },
  late: { label: 'En retard', tone: 'pending', glyph: 'dot' },
  excused: { label: 'Absent · justifié', tone: 'info', glyph: 'dash' },
  pending: { label: 'Absent · justification envoyée', tone: 'neutral', glyph: 'dash' },
  unexcused: { label: 'Absent · non justifié', tone: 'alert', glyph: 'dash' },
  unknown: { label: 'Présence enregistrée', tone: 'neutral', glyph: null },
};

export function dayState(day: AttendanceDay): DayState {
  switch (day.status) {
    case 'PRESENT':
      return 'present';
    case 'LATE':
      return 'late';
    case 'ABSENT':
      if (day.justified) return 'excused';
      return day.justification?.status === 'PENDING' ? 'pending' : 'unexcused';
    default:
      return 'unknown';
  }
}

/** « absent, non justifié » : l'état dans une phrase lue. */
export function spokenState(state: DayState): string {
  return DAY_STATES[state].label.toLowerCase().replace(' · ', ', ');
}
