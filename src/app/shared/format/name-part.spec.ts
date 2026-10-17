import { namePart } from './name-part';

describe('namePart', () => {
  it('garde un nom, sans ses espaces', () => {
    expect(namePart('  Léonie ')).toBe('Léonie');
    expect(namePart('Na')).toBe('Na');
  });

  it('écarte une partie absente ou une valeur de remplissage', () => {
    for (const value of [null, undefined, '', '  ', 'N/A', 'n/a', 'N.A.', '-', '—', 'null']) {
      expect(namePart(value)).toBeNull();
    }
  });
});
