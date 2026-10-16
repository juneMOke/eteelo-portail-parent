import { subjectTone } from './subject-tone';

describe('subjectTone', () => {
  it('donne toujours le même ton à une matière, quelle que soit la casse', () => {
    expect(subjectTone('NUM')).toEqual(subjectTone('num'));
    expect(subjectTone('NUM').color).toMatch(/^var\(--color-subject-[1-6]\)$/);
    expect(subjectTone('NUM').soft).toBe(subjectTone('NUM').color.replace(')', '-soft)'));
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
