import { namePart } from '../../shared/format/name-part';
import { childPhotoUrl } from '../api/parent-api';
import { Child } from './bootstrap.schema';

/**
 * Mise en forme des données brutes d'un enfant (le back ne compose aucun libellé).
 * Prénom, à défaut le nom ; un « N/A » d'import compte comme absent ; la classe peut manquer tant que l'élève n'est pas placé.
 */
export function childName(child: Child): string {
  return namePart(child.firstName) ?? namePart(child.lastName) ?? child.lastName;
}

/** Nom complet : prénom, nom, postnom (« Grâce Mbala Nsimba ») ; les parties absentes sont omises. */
export function childFullName(child: Child): string {
  return [child.firstName, child.lastName, child.surname].map(namePart).filter(Boolean).join(' ');
}

export function childClass(child: Child): string | null {
  return child.classroom?.name ?? null;
}

/** « Grâce · 5e B », ou « Grâce » seul sans classe (jamais « Grâce · »). */
export function childLabel(child: Child, separator = ' · '): string {
  const className = childClass(child);
  return className ? `${childName(child)}${separator}${className}` : childName(child);
}

export function childPhoto(child: Child): string | null {
  return child.photoFingerprint ? childPhotoUrl(child.childId, child.photoFingerprint) : null;
}
