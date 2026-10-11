/**
 * Mise en forme du numéro saisi en E.164 (+243…), sans en juger la validité métier :
 * le serveur reste seul juge du compte. Accepte espaces, points, tirets, 0 initial ou 00243.
 * Rend null si la saisie ne ressemble pas à un mobile de RDC.
 */
export function toE164(input: string): string | null {
  const digits = input.replace(/[\s.\-()]/g, '');
  const national = digits.replace(/^(\+243|00243|0)/, '');
  return /^[89]\d{8}$/.test(national) ? `+243${national}` : null;
}
