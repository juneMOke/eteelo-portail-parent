import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { TimetableWeek } from '../../../../core/api/timetable.contract';
import { course, timetableFixture } from '../../../../../testing/timetable.fixture';
import {
  columnHead,
  dayContent,
  daySummary,
  dayTitle,
  evaluationLabel,
  isNow,
  openingDay,
  schoolInstant,
  shownDay,
  stepDay,
  stepWeek,
  stripDay,
  weekSummary,
} from './timetable-view';

registerLocaleData(localeFr);

const week = (day?: string) => timetableFixture(day) as TimetableWeek;
const at = (date: string, time: string) => ({ date, time });

describe('schoolInstant', () => {
  it('lit un instant au fuseau de l’école', () => {
    expect(schoolInstant('2026-09-22T09:30:00Z', 'Africa/Kinshasa')).toEqual(
      at('2026-09-22', '10:30'),
    );
    expect(schoolInstant('2026-09-22T23:30:00Z', 'Africa/Kinshasa')).toEqual(
      at('2026-09-23', '00:30'),
    );
  });
});

describe('openingDay', () => {
  it('ouvre sur aujourd’hui tant que le dernier cours n’est pas fini', () => {
    expect(openingDay(week(), at('2026-09-22', '11:44'))).toBe('2026-09-22');
  });

  it('passe au prochain jour qui a cours une fois les cours finis', () => {
    expect(openingDay(week(), at('2026-09-22', '11:45'))).toBe('2026-09-23');
  });

  it('ne trouve rien après le dernier cours du vendredi : la façade lit la semaine suivante', () => {
    const friday = { ...week(), today: '2026-09-25' };
    expect(openingDay(friday, at('2026-09-25', '12:00'))).toBeNull();
  });

  it('ouvre une semaine à venir sur son premier jour de cours', () => {
    const next = { ...week('2026-09-28'), today: '2026-09-26' };
    expect(openingDay(next, at('2026-09-26', '09:00'))).toBe('2026-09-28');
  });

  it('ouvre une semaine sans cours sur aujourd’hui', () => {
    const unpublished = timetableFixture(undefined, '7b2e3d4c-5f6a-4b7c-9d8e-0f1a2b3c4d5e')!;
    expect(openingDay(unpublished, at('2026-09-22', '12:00'))).toBe('2026-09-22');
  });
});

describe('shownDay', () => {
  it('montre le jour demandé, sinon le jour d’ouverture', () => {
    expect(shownDay(week(), '2026-09-24', null).date).toBe('2026-09-24');
    expect(shownDay(week(), undefined, '2026-09-23').date).toBe('2026-09-23');
  });

  it('ramène un samedi absent au vendredi', () => {
    expect(shownDay(week(), '2026-09-26', null).date).toBe('2026-09-25');
  });
});

describe('stepDay et stepWeek', () => {
  it('passe d’un jour d’école à l’autre, du vendredi au lundi suivant', () => {
    expect(stepDay(week(), '2026-09-22', 1)).toBe('2026-09-23');
    expect(stepDay(week(), '2026-09-25', 1)).toBe('2026-09-28');
    expect(stepDay(week(), '2026-09-21', -1)).toBe('2026-09-19');
  });

  it('s’arrête aux bornes de l’année scolaire', () => {
    expect(stepDay(week('2026-09-07'), '2026-09-07', -1)).toBeNull();
    expect(stepWeek(week('2026-09-07'), -1)).toBeNull();
    expect(stepWeek(week(), 1)).toBe('2026-09-28');
    expect(stepWeek(week('2027-06-28'), 1)).toBeNull();
  });
});

describe('libellés', () => {
  it('dit le jour, la bande des jours et la tête de colonne', () => {
    expect(dayTitle('2026-09-22', 'fr')).toBe('Mardi 22 septembre 2026');
    expect(dayTitle('2026-10-01', 'fr')).toBe('Jeudi 1er octobre 2026');
    expect(stripDay('2026-09-22', 'fr')).toEqual({ weekday: 'Mar', number: '22' });
    expect(columnHead('2026-09-21', 'fr')).toEqual({ weekday: 'Lundi', date: '21 sept.' });
  });

  it('résume la journée sans rien calculer', () => {
    const [monday, tuesday, , thursday] = week().days;
    expect(daySummary(tuesday, '2026-09-22')).toBe('Aujourd’hui · 5 cours · 7 h 30 à 11 h 45');
    expect(daySummary(monday, '2026-09-22')).toBe('Hier · 4 cours · 7 h 30 à 11 h 45');
    expect(daySummary(thursday, '2026-09-22')).toBe('4 cours · 7 h 30 à 11 h 45 · 2 épreuves');
  });

  it('dit un jour sans cours, fermé ou non publié', () => {
    const empty = week('2026-10-02').days[4];
    expect(dayContent(empty)).toBe('empty');
    expect(daySummary(empty, '2026-09-22')).toBe('Aucun cours');
    const weekend = { ...empty, state: 'WEEKEND' };
    expect(dayContent(weekend)).toBe('closed');
    expect(daySummary(weekend, '2026-10-01')).toBe('Demain · Pas d’école');
    expect(dayContent({ ...empty, state: 'NOT_PUBLISHED' })).toBe('unpublished');
  });

  it('résume la semaine', () => {
    expect(weekSummary(week())).toBe('Cette semaine · 21 cours');
    expect(weekSummary(week('2026-09-28'))).toBe('Semaine prochaine · 17 cours');
  });

  it('dit une interrogation ou un examen, avec sa durée', () => {
    expect(evaluationLabel({ id: 'e', type: 'EXAMEN', durationMinutes: 90 })).toBe(
      'Examen · 1 h 30',
    );
    expect(evaluationLabel({ id: 'e', type: 'INTERRO', durationMinutes: null })).toBe(
      'Interrogation',
    );
  });
});

describe('isNow', () => {
  const maths = course('maths', '10:15', '11:00');

  it('pose « En ce moment » du début compris à la fin exclue, aujourd’hui seulement', () => {
    expect(isNow(maths, '2026-09-22', at('2026-09-22', '10:15'))).toBe(true);
    expect(isNow(maths, '2026-09-22', at('2026-09-22', '11:00'))).toBe(false);
    expect(isNow(maths, '2026-09-23', at('2026-09-22', '10:30'))).toBe(false);
    expect(isNow(maths, '2026-09-22', null)).toBe(false);
  });
});
