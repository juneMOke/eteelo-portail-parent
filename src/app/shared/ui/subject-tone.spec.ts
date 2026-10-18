import { subjectInitials, subjectTone } from './subject-tone';

describe('subjectInitials', () => {
  it('prend les deux premières lettres de la matière, en capitales', () => {
    expect(subjectInitials('Mathématiques')).toBe('MA');
    expect(subjectInitials('Éducation civique')).toBe('ÉD');
    expect(subjectInitials('3e langue')).toBe('EL');
  });
});

describe('subjectTone', () => {
  it('donne toujours le même ton à une matière, quelle que soit la casse', () => {
    expect(subjectTone('NUM')).toEqual(subjectTone('num'));
    expect(subjectTone('NUM').color).toMatch(/^var\(--color-subject-[1-6]\)$/);
    expect(subjectTone('NUM').soft).toBe(subjectTone('NUM').color.replace(')', '-soft)'));
  });

  it('donne le ton gris à une matière hors grille officielle', () => {
    expect(subjectTone(null).color).toBe('var(--color-subject-6)');
  });

  it('répartit les matières sur plusieurs tons', () => {
    const tones = new Set(
      ['NUM', 'FRA', 'ANG', 'GEO', 'HIS', 'PHY', 'CHI', 'BIO'].map(
        (code) => subjectTone(code).color,
      ),
    );
    expect(tones.size).toBeGreaterThan(3);
  });
});
