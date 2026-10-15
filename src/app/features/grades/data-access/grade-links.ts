import { Params } from '@angular/router';
import { GradedEvaluation } from '../../../core/api/grades.contract';
import { NavEntryId, childLink, navEntry } from '../../../core/navigation/nav';

/** Pages de Mes notes d'où l'on ouvre une fiche, et où son bouton retour ramène. */
export type GradesOrigin = Extract<NavEntryId, 'grades-week' | 'courses'>;

/**
 * Fiche d'une évaluation, par le routeur (aucune feature n'importe une autre) : une
 * interrogation ou un examen s'ouvre dans Mes évaluations, un devoir dans Mes devoirs.
 */
export function evaluationLink(childId: string, evaluation: GradedEvaluation): string[] {
  const entry = navEntry(evaluation.kind === 'HOMEWORK' ? 'homework' : 'assessments');
  return [...childLink(childId, entry.path), evaluation.evaluationId];
}

/**
 * Paramètres de la fiche : `from` dit au bouton retour quelle page de Mes notes rouvrir, les
 * autres lui rendent son état (« même semaine », « même sélection, même cours déplié »).
 */
export function evaluationQueryParams(origin: GradesOrigin, state: Params): Params {
  return { from: origin, ...state };
}

export function gradesLink(childId: string, id: GradesOrigin | 'report-card'): string[] {
  return childLink(childId, navEntry(id).path);
}
