/** Valeurs de remplissage laissées par la saisie ou l'import (« N/A », « - ») : pas un nom. */
const PLACEHOLDERS = new Set(['', 'N/A', 'N.A.', '-', '—', 'NULL']);

/**
 * Une partie de nom (prénom, nom, postnom) telle qu'elle s'affiche : sans espaces autour, null
 * quand elle manque ou n'est qu'une valeur de remplissage.
 */
export function namePart(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return PLACEHOLDERS.has(trimmed.toUpperCase()) ? null : trimmed;
}
