import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { GRADE_PERIODS, TERM } from '../../../../testing/grades-terms.fixture';
import {
  capitalized,
  evolutionLabel,
  percentLabel,
  periodUnit,
  pointsLabel,
  rankLabel,
  selectionAnnouncement,
  selectionPhrase,
  shortDayLabel,
  shortWeekLabel,
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

  it('abrège la semaine pour le téléphone', () => {
    expect(shortWeekLabel('2026-09-21', '2026-09-26', 'fr')).toBe('21 – 26 sept.');
    expect(shortWeekLabel('2026-09-28', '2026-10-03', 'fr')).toBe('28 sept. – 3 oct.');
  });

  it('écrit une date de frise et un titre à initiale capitale', () => {
    expect(shortDayLabel('2026-09-22', 'fr')).toBe('Mar. 22 sept.');
    expect(capitalized('les acides')).toBe('Les acides');
  });

  it('résume la semaine', () => {
    expect(weekSummary({ total: 6, graded: 4, pending: 2 })).toBe(
      '6 évaluations · 4 notées · 2 en attente',
    );
    expect(weekSummary({ total: 1, graded: 1, pending: 0 })).toBe('1 évaluation · 1 notée');
    expect(weekSummary({ total: 0, graded: 0, pending: 0 })).toBe('Aucune évaluation');
  });

  it('écrit un rang et une évolution', () => {
    expect(rankLabel({ position: 8, of: 32 })).toBe('8e sur 32');
    expect(rankLabel({ position: 1, of: 32 })).toBe('1er sur 32');
    expect(evolutionLabel({ points: 0.8, versus: '1er trimestre · 1re période' }, 'fr')).toBe(
      '+0,8 pt par rapport au 1er trimestre · 1re période',
    );
    expect(evolutionLabel({ points: -2.25, versus: '1er trimestre' }, 'fr')).toBe(
      '−2,3 pt par rapport au 1er trimestre',
    );
  });

  it('dit la sélection dans une phrase', () => {
    const phrase = (part: string) =>
      selectionPhrase(GRADE_PERIODS, { periodId: TERM.first, part, label: '' });

    expect(phrase('SECOND')).toBe('la 2e période du 1er trimestre');
    expect(phrase('EXAM')).toBe('l’examen du 1er trimestre');
    expect(phrase('ALL')).toBe('le 1er trimestre');
  });

  it('nomme l’unité de l’année d’après le serveur', () => {
    expect(periodUnit(GRADE_PERIODS)).toBe('trimestre');
    expect(periodUnit([{ ...GRADE_PERIODS[0], label: '1er semestre' }])).toBe('semestre');
    expect(periodUnit([])).toBe('trimestre');
  });

  it('annonce la sélection et le nombre de cours', () => {
    const selection = { periodId: 't1', part: 'SECOND', label: '1er trimestre · 2e période' };

    expect(selectionAnnouncement(selection, 5)).toBe('1er trimestre, 2e période, 5 cours.');
  });
});
