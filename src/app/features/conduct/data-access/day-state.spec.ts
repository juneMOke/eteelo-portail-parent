import { attendanceDay } from '../../../../testing/attendance.fixture';
import { DAY_STATES, dayState, spokenState } from './day-state';

describe('day-state', () => {
  it('lit l’état d’un jour sur ce que rend le serveur', () => {
    expect(dayState(attendanceDay('2026-09-08'))).toBe('present');
    expect(dayState(attendanceDay('2026-09-08', { status: 'LATE' }))).toBe('late');
    expect(dayState(attendanceDay('2026-09-08', { status: 'ABSENT', justified: true }))).toBe(
      'excused',
    );
    expect(dayState(attendanceDay('2026-09-08', { status: 'ABSENT', justified: false }))).toBe(
      'unexcused',
    );
    expect(dayState(attendanceDay('2026-09-08', { status: 'HOLIDAY' }))).toBe('unknown');
  });

  it('montre une justification en attente, et un refus comme une absence non justifiée', () => {
    const sent = (status: string) =>
      attendanceDay('2026-09-08', {
        status: 'ABSENT',
        justified: false,
        justification: {
          status,
          reason: 'SICKNESS',
          submittedAt: '2026-09-08T09:00:00Z',
          decidedAt: null,
          decisionNote: null,
        },
      });

    expect(dayState(sent('PENDING'))).toBe('pending');
    expect(dayState(sent('REJECTED'))).toBe('unexcused');
  });

  it('dit chaque état en un mot, avec un glyphe pour ne pas laisser la couleur seule', () => {
    expect(DAY_STATES.unexcused).toEqual({
      label: 'Absent · non justifié',
      tone: 'alert',
      glyph: 'dash',
    });
    expect(DAY_STATES.late.glyph).toBe('dot');
    expect(spokenState('unexcused')).toBe('absent, non justifié');
  });
});
