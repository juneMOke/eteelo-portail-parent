import { averageColor, displayedScore, gradeStateView } from './grade-state';

describe('grade-state', () => {
  it('donne un mot et un ton à chacun des six états', () => {
    expect(gradeStateView('PASSED')).toEqual({
      word: 'Réussie',
      tone: 'success',
      placeholder: null,
      pill: null,
    });
    expect(gradeStateView('AVERAGE').tone).toBe('info');
    expect(gradeStateView('FAILED').word).toBe('En échec');
    expect(gradeStateView('PENDING').placeholder).toBe('En attente');
    expect(gradeStateView('PENDING').pill).toBe('Pas encore noté');
    expect(gradeStateView('ABSENT_EXCUSED')).toEqual({
      word: 'Absent · justifié',
      tone: 'pending',
      placeholder: 'Pas de note',
      pill: 'Pas de note',
    });
    expect(gradeStateView('ABSENT_UNEXCUSED').tone).toBe('alert');
  });

  it('reste neutre devant un état inconnu', () => {
    expect(gradeStateView('ARCHIVED')).toEqual({
      word: 'État non précisé',
      tone: 'neutral',
      placeholder: '—',
      pill: 'Pas de note',
    });
  });

  it('affiche la note, le zéro d’une absence non justifiée, mais pas une attente', () => {
    expect(displayedScore({ state: 'FAILED', points: 9, maxPoints: 20 })).toEqual({
      points: 9,
      maxPoints: 20,
    });
    expect(displayedScore({ state: 'ABSENT_UNEXCUSED', points: 0, maxPoints: 20 })?.points).toBe(0);
    expect(displayedScore({ state: 'PENDING', points: null, maxPoints: 20 })).toBeNull();
    expect(displayedScore({ state: 'ABSENT_EXCUSED', points: null, maxPoints: 40 })).toBeNull();
  });

  it('colore une moyenne selon le ton du serveur', () => {
    expect(averageColor('PASSED')).toBe('var(--color-grade-good)');
    expect(averageColor('AVERAGE')).toBe('var(--color-grade-fair)');
    expect(averageColor('FAILED')).toBe('var(--color-grade-low)');
    expect(averageColor(null)).toBe('var(--color-text-muted)');
  });
});
