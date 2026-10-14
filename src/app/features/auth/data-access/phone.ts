/**
 * Mise en forme du numéro saisi en E.164, sans en juger la validité métier :
 * le serveur reste seul juge du compte. Accepte espaces, points, tirets et parenthèses.
 * - Numéro de RDC : 0 initial, 00243 ou +243 (suivi ou non du 0 national), 9 chiffres
 *   nationaux quel que soit l'opérateur.
 * - Numéro étranger (parent de la diaspora) : indicatif écrit avec + ou 00, 8 à 15 chiffres.
 * Rend null si la saisie ne ressemble à aucun numéro.
 */
export function toE164(input: string): string | null {
  const digits = input.replace(/[\s.\-()]/g, '').replace(/^00/, '+');

  if (!digits.startsWith('+') || digits.startsWith('+243')) {
    const national = digits.replace(/^(?:\+243)?0?/, '');
    return /^[1-9]\d{8}$/.test(national) ? `+243${national}` : null;
  }
  return /^\+[1-9]\d{7,14}$/.test(digits) ? digits : null;
}
