import { toE164 } from './phone';

describe('toE164', () => {
  it('accepte les écritures courantes d’un numéro de RDC', () => {
    for (const input of [
      '+243 81 563 2080',
      '0815632080',
      '00243815632080',
      '81.563.20.80',
      '+243 0815632080',
      '+243 (0)81 563 2080',
    ]) {
      expect(toE164(input)).toBe('+243815632080');
    }
  });

  it('accepte tous les préfixes d’opérateur', () => {
    expect(toE164('0712345678')).toBe('+243712345678');
    expect(toE164('0612345678')).toBe('+243612345678');
  });

  it('accepte un numéro étranger écrit avec son indicatif', () => {
    expect(toE164('+33 7 53 04 90 22')).toBe('+33753049022');
    expect(toE164('0033753049022')).toBe('+33753049022');
  });

  it('refuse ce qui ne ressemble pas à un numéro', () => {
    for (const input of ['', '12345', '08156320801', '+33 12', '+0612345678']) {
      expect(toE164(input)).toBeNull();
    }
  });
});
