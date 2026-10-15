import { statusView } from './assignment-status';

describe('statusView', () => {
  it('donne un mot et un ton à chaque statut du serveur', () => {
    expect(statusView('UPCOMING')).toEqual({ label: 'À venir', tone: 'pending', icon: 'clock' });
    expect(statusView('AWAITING_GRADE').tone).toBe('info');
    expect(statusView('GRADED')).toEqual(
      expect.objectContaining({ label: 'Corrigé', tone: 'success' }),
    );
    expect(statusView('ABSENT')).toEqual(
      expect.objectContaining({ label: 'Absent à l’épreuve', tone: 'alert' }),
    );
  });

  it('reste neutre devant un statut que le front ne connaît pas encore', () => {
    expect(statusView('POSTPONED')).toEqual({
      label: 'Statut non précisé',
      tone: 'neutral',
      icon: 'info',
    });
  });
});
