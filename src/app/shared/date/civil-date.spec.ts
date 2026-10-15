import {
  addDays,
  addMonths,
  civilToDate,
  daysBetween,
  daysOf,
  firstDayOf,
  isCivilDate,
  isCivilMonth,
  mondayOf,
  monthOf,
} from './civil-date';

describe('civil-date', () => {
  it('lit une date civile à minuit UTC', () => {
    expect(civilToDate('2026-09-22').toISOString()).toBe('2026-09-22T00:00:00.000Z');
  });

  it('refuse une date mal formée ou impossible', () => {
    expect(isCivilDate('2026-09-22')).toBe(true);
    expect(isCivilDate('22/09/2026')).toBe(false);
    expect(isCivilDate('2026-13-40')).toBe(false);
    expect(isCivilDate(undefined)).toBe(false);
  });

  it('avance et recule de jours entiers, mois et années compris', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(daysBetween('2026-09-22', '2026-10-02')).toBe(10);
  });

  it('ramène un jour au lundi de sa semaine', () => {
    expect(mondayOf('2026-09-24')).toBe('2026-09-21');
    expect(mondayOf('2026-09-21')).toBe('2026-09-21');
    expect(mondayOf('2026-09-27')).toBe('2026-09-21');
  });

  it('lit le mois d’un jour et son premier jour', () => {
    expect(monthOf('2026-09-24')).toBe('2026-09');
    expect(firstDayOf('2026-09')).toBe('2026-09-01');
    expect(isCivilMonth('2026-09')).toBe(true);
    expect(isCivilMonth('2026-13')).toBe(false);
    expect(isCivilMonth('2026-09-01')).toBe(false);
  });

  it('avance et recule de mois entiers, années comprises', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-09', 0)).toBe('2026-09');
  });

  it('liste les jours d’un mois', () => {
    expect(daysOf('2026-02')).toHaveLength(28);
    expect(daysOf('2026-09').at(0)).toBe('2026-09-01');
    expect(daysOf('2026-09').at(-1)).toBe('2026-09-30');
  });
});
