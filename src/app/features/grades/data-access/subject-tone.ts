/** Nombre de tons de matière définis dans les jetons (`--color-subject-1` à `-6`). */
const SUBJECT_TONES = 6;

/** Ton d'une matière : sa couleur pleine (filet, sigle) et sa couleur douce (fond du sigle). */
export interface SubjectTone {
  readonly color: string;
  readonly soft: string;
}

/**
 * Ton décoratif d'une matière, tiré de son code (« NUM », « GEO ») : le même cours garde la même
 * couleur sur Ma semaine, Mes cours et Mon bulletin, pour tous les enfants. Mise en forme
 * seulement ; la couleur ne dit rien de la note.
 */
export function subjectTone(code: string): SubjectTone {
  let hash = 0;
  for (const char of code.toUpperCase()) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  const index = (hash % SUBJECT_TONES) + 1;
  return { color: `var(--color-subject-${index})`, soft: `var(--color-subject-${index}-soft)` };
}
