import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { AssignmentWindow } from '../../../core/api/assignments.contract';
import {
  nearDay,
  openingWeek,
  schoolWeekOf,
  shortWeekLabel,
  weekDays,
  weekLabel,
  weekOffset,
  weekRange,
} from './school-week';

registerLocaleData(localeFr);

const WINDOW: AssignmentWindow = {
  from: '2026-09-01',
  to: '2026-10-20',
  today: '2026-09-22',
  schoolDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
};

describe('school-week', () => {
  it('désigne la semaine par son lundi, et passe à la suivante le week-end', () => {
    expect(schoolWeekOf('2026-09-22')).toBe('2026-09-21');
    expect(schoolWeekOf('2026-09-26')).toBe('2026-09-28');
    expect(schoolWeekOf('2026-09-27')).toBe('2026-09-28');
    expect(weekDays('2026-09-21')).toEqual([
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
    ]);
  });

  it('borne la navigation à deux semaines de part et d’autre, dans la fenêtre', () => {
    expect(weekRange(WINDOW)).toEqual({ first: '2026-09-07', last: '2026-10-05' });
    expect(weekRange({ ...WINDOW, from: '2026-09-16', to: '2026-09-30' })).toEqual({
      first: '2026-09-14',
      last: '2026-09-28',
    });
  });

  it('ouvre la semaine demandée si elle est atteignable, sinon la semaine en cours', () => {
    expect(openingWeek(WINDOW, '2026-09-30', null)).toBe('2026-09-28');
    expect(openingWeek(WINDOW, null, '2026-09-14')).toBe('2026-09-14');
    expect(openingWeek(WINDOW, '2026-11-02', null)).toBe('2026-09-21');
    expect(openingWeek(WINDOW, 'n’importe quoi', undefined)).toBe('2026-09-21');
  });

  it('compte l’écart avec la semaine en cours', () => {
    expect(weekOffset('2026-10-05', '2026-09-22')).toBe(2);
  });

  it('intitule la semaine, y compris à cheval sur deux mois ou deux ans', () => {
    expect(weekLabel('2026-09-21', 'fr')).toBe('Semaine du 21 au 25 septembre 2026');
    expect(weekLabel('2026-09-28', 'fr')).toBe('Semaine du 28 septembre au 2 octobre 2026');
    expect(weekLabel('2025-12-29', 'fr')).toBe('Semaine du 29 décembre 2025 au 2 janvier 2026');
    expect(weekLabel('2026-04-27', 'fr')).toBe('Semaine du 27 avril au 1er mai 2026');
    expect(shortWeekLabel('2026-09-21', 'fr')).toBe('21 – 25 sept.');
    expect(shortWeekLabel('2026-09-28', 'fr')).toBe('28 sept. – 2 oct.');
  });

  it('nomme les jours proches', () => {
    expect(nearDay('2026-09-22', '2026-09-22')).toBe('aujourd’hui');
    expect(nearDay('2026-09-23', '2026-09-22')).toBe('demain');
    expect(nearDay('2026-09-25', '2026-09-22')).toBeNull();
  });
});
