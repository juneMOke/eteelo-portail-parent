import { AssignmentWindow } from '../../../core/api/assignments.contract';
import { isSchoolDay, nextBusyDay, openingDay, relativeDay, stepSchoolDay } from './school-days';

// Mardi 22 septembre 2026 ; école du lundi au vendredi.
const WINDOW: AssignmentWindow = {
  from: '2026-09-01',
  to: '2026-10-20',
  today: '2026-09-22',
  schoolDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
};

describe('school-days', () => {
  it("ne tient que les jours de cours de l'école", () => {
    expect(isSchoolDay('2026-09-25', WINDOW)).toBe(true); // vendredi
    expect(isSchoolDay('2026-09-26', WINDOW)).toBe(false); // samedi
    expect(
      isSchoolDay('2026-09-26', { ...WINDOW, schoolDays: [...WINDOW.schoolDays, 'SAT'] }),
    ).toBe(true);
  });

  it("saute le week-end et s'arrête aux bornes", () => {
    expect(stepSchoolDay('2026-09-25', 1, WINDOW)).toBe('2026-09-28');
    expect(stepSchoolDay('2026-09-28', -1, WINDOW)).toBe('2026-09-25');
    expect(stepSchoolDay('2026-09-01', -1, WINDOW)).toBeNull();
    expect(stepSchoolDay('2026-10-20', 1, WINDOW)).toBeNull();
  });

  it('dit la position du jour en mots', () => {
    expect(relativeDay('2026-09-22', WINDOW.today)).toBe('aujourd’hui');
    expect(relativeDay('2026-09-23', WINDOW.today)).toBe('demain');
    expect(relativeDay('2026-09-21', WINDOW.today)).toBe('hier');
    expect(relativeDay('2026-09-24', WINDOW.today)).toBe('dans 2 jours');
    expect(relativeDay('2026-09-15', WINDOW.today)).toBe('semaine passée');
    expect(relativeDay('2026-10-20', WINDOW.today)).toBeNull();
  });

  it("ouvre sur le prochain jour occupé, sinon aujourd'hui", () => {
    expect(openingDay(WINDOW, null, ['2026-09-15', '2026-10-02', '2026-09-24'])).toBe('2026-09-24');
    expect(openingDay(WINDOW, null, ['2026-09-15'])).toBe('2026-09-22');
  });

  it('garde le jour demandé dans la fenêtre, ignore le reste', () => {
    expect(openingDay(WINDOW, '2026-09-15', ['2026-09-24'])).toBe('2026-09-15');
    expect(openingDay(WINDOW, '2027-01-01', ['2026-09-24'])).toBe('2026-09-24');
    expect(openingDay(WINDOW, 'demain', [])).toBe('2026-09-22');
  });

  it('trouve le prochain jour occupé', () => {
    expect(nextBusyDay('2026-09-22', ['2026-10-02', '2026-09-15', '2026-09-24'])).toBe(
      '2026-09-24',
    );
    expect(nextBusyDay('2026-10-02', ['2026-10-02'])).toBeNull();
  });
});
