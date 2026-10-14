import { RelationshipType } from '../../../core/session/bootstrap.schema';

/** Aucune civilité n'est stockée : elle se déduit du lien de parenté avec l'enfant affiché. */
const CIVILITY: Partial<Record<RelationshipType, string>> = { MOTHER: 'Mme', FATHER: 'M.' };

/**
 * « Mbote, Mme Kabila » ; « Mbote » seul quand la civilité ou le nom manque.
 * Jamais le prénom du parent, jamais de variante horaire (spec Accueil, § 5).
 */
export function greeting(
  parentLastName: string | null | undefined,
  relation?: RelationshipType,
): string {
  const civility = relation ? CIVILITY[relation] : undefined;
  const name = parentLastName?.trim();
  return civility && name ? `Mbote, ${civility} ${name}` : 'Mbote';
}
