/** Nombre de tons de matière définis dans les jetons (`--color-subject-1` à `-6`). */
const SUBJECT_TONES = 6;

/** Ton d'une matière : sa couleur pleine (filet, sigle) et sa couleur douce (fond du sigle). */
export interface SubjectTone {
  readonly color: string;
  readonly soft: string;
}

/** Matière hors grille officielle, sans code : le ton gris (spec 04, matière hors référentiel). */
const OFF_GRID: SubjectTone = {
  color: `var(--color-subject-${SUBJECT_TONES})`,
  soft: `var(--color-subject-${SUBJECT_TONES}-soft)`,
};

/**
 * Ton décoratif d'une matière, tiré de son code (« NUM », « GEO ») : le même cours garde la même
 * couleur sur Mes notes et Mon emploi du temps, pour tous les enfants. Mise en forme seulement ;
 * la couleur ne dit rien de la note.
 */
export function subjectTone(code: string | null): SubjectTone {
  if (!code) return OFF_GRID;
  let hash = 0;
  for (const char of code.toUpperCase()) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  const index = (hash % SUBJECT_TONES) + 1;
  return { color: `var(--color-subject-${index})`, soft: `var(--color-subject-${index}-soft)` };
}

/** Sigle d'une matière : ses deux premières lettres, en capitales (« Mathématiques » → « MA »). */
export function subjectInitials(label: string): string {
  return [...label.replace(/[^\p{L}]/gu, '')].slice(0, 2).join('').toLocaleUpperCase('fr');
}
