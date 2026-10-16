import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { shortWeekLabel, weekLabel } from './week-labels';

registerLocaleData(localeFr);

describe('week-labels', () => {
  it('nomme la semaine par ses jours, sur un ou deux mois', () => {
    expect(weekLabel('2026-09-21', '2026-09-25', 'fr')).toBe('Semaine du 21 au 25 septembre');
    expect(weekLabel('2026-09-28', '2026-10-02', 'fr')).toBe(
      'Semaine du 28 septembre au 2 octobre',
    );
    expect(weekLabel('2026-05-25', '2026-06-01', 'fr')).toBe('Semaine du 25 mai au 1er juin');
  });

  it('abrège la semaine pour le téléphone', () => {
    expect(shortWeekLabel('2026-09-21', '2026-09-26', 'fr')).toBe('21 – 26 sept.');
    expect(shortWeekLabel('2026-09-28', '2026-10-03', 'fr')).toBe('28 sept. – 3 oct.');
  });
});
