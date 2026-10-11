import { toE164 } from './phone';

describe('toE164', () => {
  it('accepte les écritures courantes d’un mobile de RDC', () => {
    for (const input of ['+243 81 563 2080', '0815632080', '00243815632080', '81.563.20.80']) {
      expect(toE164(input)).toBe('+243815632080');
    }
  });

  it('refuse ce qui ne ressemble pas à un mobile', () => {
    for (const input of ['', '12345', '+33612345678', '0215632080']) {
      expect(toE164(input)).toBeNull();
    }
  });
});
