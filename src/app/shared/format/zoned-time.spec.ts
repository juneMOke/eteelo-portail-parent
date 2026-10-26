import { zonedDay, zonedTime } from './zoned-time';

describe('zoned-time', () => {
  it('lit un instant UTC à l’heure de Kinshasa (UTC+1)', () => {
    expect(zonedDay('2026-10-24T08:30:00Z', 'Africa/Kinshasa')).toBe('2026-10-24');
    expect(zonedTime('2026-10-24T08:30:00Z', 'Africa/Kinshasa')).toBe('9 h 30');
  });

  it('change de jour à minuit de l’école, pas à minuit UTC', () => {
    expect(zonedDay('2026-10-24T23:30:00Z', 'Africa/Kinshasa')).toBe('2026-10-25');
    expect(zonedTime('2026-10-24T23:30:00Z', 'Africa/Kinshasa')).toBe('0 h 30');
    expect(zonedDay('2026-10-24T22:30:00Z', 'Africa/Lubumbashi')).toBe('2026-10-25');
  });

  it('retombe sur le fuseau du téléphone pour un fuseau inconnu', () => {
    expect(zonedDay('2026-10-24T12:00:00Z', 'Pas/Un_Fuseau')).toMatch(/^2026-10-2[45]$/);
  });
});
