import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { dayLabel, monthLabel, shortDate, spokenDay } from './day-labels';

registerLocaleData(localeFr);

describe('day-labels', () => {
  it('écrit un jour pour l’œil et pour l’oreille', () => {
    expect(dayLabel('2026-09-22', 'fr')).toBe('Mardi 22/09');
    expect(spokenDay('2026-09-22', 'fr')).toBe('Mardi 22 septembre');
    expect(shortDate('2026-09-30', 'fr')).toBe('30/09');
  });

  it('écrit un mois', () => {
    expect(monthLabel('2026-09', 'fr')).toBe('Septembre 2026');
  });
});
