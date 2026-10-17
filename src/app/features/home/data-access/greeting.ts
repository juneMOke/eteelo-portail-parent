import { Parent, RelationshipType } from '../../../core/session/bootstrap.schema';
import { namePart } from '../../../shared/format/name-part';

/** Aucune civilité n'est stockée : elle se déduit du lien de parenté avec l'enfant affiché. */
const CIVILITY: Partial<Record<RelationshipType, string>> = { MOTHER: 'Mme', FATHER: 'M.' };

/**
 * Le nom qui suit « Mbote, » : civilité (mère, père), prénom, nom, postnom, soit
 * « Mme Léonie Kabila Mwamba ». Prénom et postnom sont omis quand ils manquent (ou ne sont
 * qu'un « N/A » d'import) ;
 * null sans nom (« Mbote » seul). Écart assumé à la spec Accueil § 5 (qui excluait
 * le prénom), décidé le 16/10/2026.
 */
export function greetingName(
  parent: Pick<Parent, 'firstName' | 'lastName' | 'surname'> | null | undefined,
  relation?: RelationshipType,
): string | null {
  const lastName = namePart(parent?.lastName);
  if (!lastName) return null;
  const civility = relation ? CIVILITY[relation] : undefined;
  const words = [civility, namePart(parent?.firstName), lastName, namePart(parent?.surname)];
  return words.filter(Boolean).join(' ');
}
