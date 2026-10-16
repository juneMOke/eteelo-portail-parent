import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { hourLabel, instantDay, instantTime, timeLabel } from './time-labels';

registerLocaleData(localeFr);

describe('time-labels', () => {
  it('écrit les heures à la française', () => {
    expect(timeLabel('07:52')).toBe('7 h 52');
    expect(instantTime('2026-09-16T06:40:00Z', 'fr')).toMatch(/^\d+ h 40$/);
  });

  it('écrit une heure ronde sans ses minutes', () => {
    expect(hourLabel('08:00')).toBe('8 h');
    expect(hourLabel('18:30')).toBe('18 h 30');
  });

  it('donne le jour civil d’un instant', () => {
    expect(instantDay('2026-09-22T10:05:00Z', 'fr')).toBe('2026-09-22');
  });
});
