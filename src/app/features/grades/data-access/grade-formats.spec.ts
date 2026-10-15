import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { PERIOD, TERM, TERMS } from '../../../../testing/grades-terms.fixture';
import {
  dayLabel,
  evolutionLabel,
  percentLabel,
  pointsLabel,
  rankLabel,
  selectionAnnouncement,
  selectionPhrase,
  spokenDay,
  weekLabel,
  weekSummary,
} from './grade-formats';

registerLocaleData(localeFr);

describe('grade-formats', () => {
  it('écrit une moyenne en pourcentage à une décimale', () => {
    expect(percentLabel(64.5, 'fr')).toBe('64,5 %');
    expect(percentLabel(75, 'fr')).toBe('75,0 %');
    expect(percentLabel(12.83, 'fr')).toBe('12,8 %');
  });

  it('écrit une note sur son barème', () => {
    expect(pointsLabel(7.5, 10, 'fr')).toBe('7,5/10');
    expect(pointsLabel(16, 20, 'fr')).toBe('16/20');
  });

  it('nomme la semaine par ses jours, sur un ou deux mois', () => {
    expect(weekLabel('2026-09-21', '2026-09-25', 'fr')).toBe('Semaine du 21 au 25 septembre');
    expect(weekLabel('2026-09-28', '2026-10-02', 'fr')).toBe(
      'Semaine du 28 septembre au 2 octobre',
    );
    expect(weekLabel('2026-05-25', '2026-06-01', 'fr')).toBe('Semaine du 25 mai au 1er juin');
  });

  it('résume la semaine', () => {
    expect(weekSummary({ total: 6, graded: 4, pending: 2 })).toBe(
      '6 évaluations · 4 notées · 2 en attente',
    );
    expect(weekSummary({ total: 1, graded: 1, pending: 0 })).toBe('1 évaluation · 1 notée');
    expect(weekSummary({ total: 0, graded: 0, pending: 0 })).toBe('Aucune évaluation');
  });

  it('écrit un jour pour l’œil et pour l’oreille', () => {
    expect(dayLabel('2026-09-22', 'fr')).toBe('Mardi 22/09');
    expect(spokenDay('2026-09-22', 'fr')).toBe('Mardi 22 septembre');
  });

  it('écrit un rang et une évolution', () => {
    expect(rankLabel({ position: 8, classSize: 32 })).toBe('8e sur 32');
    expect(rankLabel({ position: 1, classSize: 32 })).toBe('1er sur 32');
    expect(evolutionLabel({ delta: 0.8, comparedToLabel: 'la 1re période' }, 'fr')).toBe(
      '+0,8 pt par rapport à la 1re période',
    );
    expect(evolutionLabel({ delta: -2.25, comparedToLabel: 'la 1re période' }, 'fr')).toBe(
      '−2,3 pt par rapport à la 1re période',
    );
  });

  it('dit la sélection dans une phrase', () => {
    const phrase = (periodId: string | null) =>
      selectionPhrase({ terms: TERMS, selection: { termId: TERM.first, periodId, label: '' } });

    expect(phrase(PERIOD.second)).toBe('la 2e période du 1er trimestre');
    expect(phrase(PERIOD.exam)).toBe('l’examen du 1er trimestre');
    expect(phrase(null)).toBe('le 1er trimestre');
  });

  it('annonce la sélection et le nombre de cours', () => {
    const selection = { termId: 't1', periodId: 'p2', label: '1er trimestre · 2e période' };

    expect(selectionAnnouncement(selection, 5)).toBe('1er trimestre, 2e période, 5 cours.');
  });
});
