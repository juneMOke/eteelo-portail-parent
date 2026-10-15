import { GradeState, GradeCard } from '../../../core/api/grades.contract';
import { GradeLevel } from '../../../shared/ui/grade/grade.component';
import { Tone } from '../../../shared/ui/tone';

export interface GradeStateView {
  /** Le mot de l'état, toujours affiché : la couleur ne fait que le confirmer. */
  readonly word: string;
  readonly tone: Tone;
  /** Ce qui tient lieu de note quand il n'y en a pas (« En attente », « Pas de note »). */
  readonly placeholder: string | null;
}

/**
 * Les six états de la spec 05 §4, un seul mot et un seul ton pour les trois pages et la fiche.
 * L'état vient du serveur ; le front ne fait que le dire. Une absence non justifiée porte un
 * « 0 » en terre cuite, comme un échec : c'est son mot qui la distingue.
 */
const STATES: Readonly<Record<string, GradeStateView>> = {
  PASSED: { word: 'Réussie', tone: 'success', placeholder: null },
  AVERAGE: { word: 'Juste la moyenne', tone: 'info', placeholder: null },
  FAILED: { word: 'En échec', tone: 'alert', placeholder: null },
  PENDING: { word: 'En attente', tone: 'neutral', placeholder: 'En attente' },
  ABSENT_EXCUSED: { word: 'Absent · justifié', tone: 'pending', placeholder: 'Pas de note' },
  ABSENT_UNEXCUSED: { word: 'Absent · non justifié', tone: 'alert', placeholder: null },
};

const UNKNOWN: GradeStateView = { word: 'État non précisé', tone: 'neutral', placeholder: '—' };

export function gradeStateView(state: GradeState): GradeStateView {
  return STATES[state] ?? UNKNOWN;
}

/** La note à afficher, ou null quand l'état en tient lieu. */
export function displayedScore(
  evaluation: Pick<GradeCard, 'state' | 'points' | 'maxPoints'>,
): { points: number; maxPoints: number } | null {
  const { points, maxPoints, state } = evaluation;
  if (points === null || gradeStateView(state).placeholder !== null) return null;
  return { points, maxPoints };
}

const AVERAGE_LEVELS: Readonly<Record<string, GradeLevel>> = {
  PASSED: 'good',
  AVERAGE: 'fair',
  FAILED: 'low',
};

/** Couleur d'une moyenne, tirée du ton que le serveur lui donne ; neutre sans moyenne. */
export function averageColor(state: GradeState | null): string {
  const level = state ? AVERAGE_LEVELS[state] : undefined;
  return level ? `var(--color-grade-${level})` : 'var(--color-text-muted)';
}
