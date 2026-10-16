import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  ATTENDANCE_TODAY,
  attendanceDay,
  attendanceFixture,
} from '../../../../testing/attendance.fixture';
import {
  absencesAndLates,
  calendarWeeks,
  daysByDate,
  daysOfMonth,
  legendStates,
  monthBounds,
  monthView,
  pendingAbsences,
  selectedMonth,
  selectedWeek,
  weekBounds,
  weekRange,
  weekTiles,
  weekView,
} from './attendance-view';

registerLocaleData(localeFr);

describe('attendance-view', () => {
  const attendance = attendanceFixture();
  const bounds = monthBounds(attendance);

  it('borne le mois de la rentrée au mois en cours', () => {
    expect(bounds).toEqual({ first: '2026-09', last: '2026-10' });
    expect(selectedMonth(bounds, undefined, undefined)).toBe('2026-10');
    expect(selectedMonth(bounds, '2026-09', undefined)).toBe('2026-09');
    expect(selectedMonth(bounds, undefined, '2026-09-16')).toBe('2026-09');
    expect(selectedMonth(bounds, '2027-03', undefined)).toBe('2026-10');
    expect(selectedMonth(bounds, '2026-06', undefined)).toBe('2026-09');
    expect(selectedMonth(bounds, 'n’importe', undefined)).toBe('2026-10');
  });

  it('range le mois du lundi au dimanche', () => {
    const weeks = calendarWeeks('2026-09', daysByDate(attendance.days), ATTENDANCE_TODAY);

    expect(weeks).toHaveLength(5);
    expect(weeks[0][0]).toBeNull();
    expect(weeks[0][1]).toMatchObject({ date: '2026-09-01', dayOfMonth: 1, state: 'present' });
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it('n’ouvre que les jours qui ont quelque chose à dire, et aujourd’hui', () => {
    const cells = calendarWeeks('2026-10', daysByDate(attendance.days), ATTENDANCE_TODAY).flat();
    const cell = (date: string) => cells.find((candidate) => candidate?.date === date);

    expect(cell('2026-10-01')).toMatchObject({ state: 'present', openable: false });
    expect(cell('2026-10-02')).toMatchObject({ state: 'unexcused', openable: true });
    expect(cell('2026-10-03')).toMatchObject({ state: 'none', openable: false });
    expect(cell(ATTENDANCE_TODAY)).toMatchObject({ state: 'none', today: true, openable: true });
  });

  it('limite la légende aux états du mois', () => {
    expect(legendStates(daysOfMonth(attendance.days, '2026-10'))).toEqual([
      'present',
      'pending',
      'unexcused',
    ]);
  });

  it('liste les absences et retards du mois, le plus récent en haut', () => {
    const list = absencesAndLates(daysOfMonth(attendance.days, '2026-09'));

    expect(list.map((day) => day.date)).toEqual([
      '2026-09-29',
      '2026-09-21',
      '2026-09-18',
      '2026-09-16',
      '2026-09-14',
      '2026-09-10',
    ]);
  });

  it('met en premier ce qui attend le parent, justifications en attente comprises', () => {
    expect(pendingAbsences(attendance)).toEqual([
      expect.objectContaining({ date: '2026-09-29', justifyUntil: '2026-10-06' }),
      expect.objectContaining({ date: '2026-10-02', justifyUntil: '2026-10-09' }),
      expect.objectContaining({ date: '2026-10-05', justifyUntil: null }),
    ]);
  });

  it('montre en attente une absence que le serveur liste encore à justifier', () => {
    const pending = attendanceDay('2026-10-02', {
      status: 'ABSENT',
      justified: false,
      justification: {
        status: 'PENDING',
        reason: 'SICKNESS',
        submittedAt: '2026-10-02T09:00:00Z',
        decidedAt: null,
        decisionNote: null,
      },
    });
    const entries = pendingAbsences({
      ...attendance,
      days: [pending],
      toJustify: [{ date: '2026-10-02', justifyUntil: '2026-10-09' }],
    });

    expect(entries).toEqual([{ date: '2026-10-02', justifyUntil: null, day: pending }]);
  });

  it('rassemble la vue du mois choisi, lue dans la réponse de l’année', () => {
    const view = monthView(attendance, '2026-09', undefined, 'fr');

    expect(view).toMatchObject({
      month: '2026-09',
      today: ATTENDANCE_TODAY,
      counts: { month: '2026-09', calledDays: 22, absences: 3, lates: 3 },
      caption: 'Septembre 2026',
      monthName: 'septembre',
      firstDayLabel: 'mardi 1 septembre',
      empty: false,
    });
    expect(view.list).toHaveLength(6);
  });

  it('borne la semaine de la rentrée à la semaine en cours, en lundis', () => {
    const weeks = weekBounds(attendance);

    expect(weeks).toEqual({ first: '2026-08-31', last: '2026-10-05' });
    expect(selectedWeek(weeks, undefined, undefined)).toBe('2026-10-05');
    expect(selectedWeek(weeks, '2026-09-17', undefined)).toBe('2026-09-14');
    expect(selectedWeek(weeks, undefined, '2026-09-16')).toBe('2026-09-14');
    expect(selectedWeek(weeks, '2026-12-01', undefined)).toBe('2026-10-05');
  });

  it('montre les jours ouvrés, le week-end seulement s’il a été appelé', () => {
    const byDate = daysByDate([...attendance.days, attendanceDay('2026-09-19')]);
    const tiles = weekTiles('2026-09-14', byDate, ATTENDANCE_TODAY, 'fr');

    expect(tiles.map((tile) => tile.state)).toEqual([
      'late',
      'present',
      'unexcused',
      'present',
      'late',
      'present',
    ]);
    expect(tiles[0]).toMatchObject({ label: 'lun 14 sept.', word: 'En retard' });
  });

  it('dit pas d’école, pas encore enregistrée, ou rien pour un jour à venir', () => {
    const tiles = weekTiles('2026-10-05', daysByDate([]), ATTENDANCE_TODAY, 'fr');

    expect(tiles.map((tile) => [tile.state, tile.word])).toEqual([
      ['off', 'Pas d’école'],
      ['not-yet', 'Pas encore enregistrée'],
      ['upcoming', null],
      ['upcoming', null],
      ['upcoming', null],
    ]);
  });

  it('demande au serveur la semaine, ramenée dans l’année montrée', () => {
    expect(weekRange('2026-09-14', attendance)).toEqual({ from: '2026-09-14', to: '2026-09-20' });
    expect(weekRange('2026-08-31', attendance)).toEqual({ from: '2026-09-01', to: '2026-09-06' });
    expect(weekRange('2026-10-05', attendance)).toEqual({ from: '2026-10-05', to: '2026-10-06' });
  });

  it('nomme la semaine et sa position', () => {
    const view = weekView(attendance, '2026-09-22', undefined, 'fr');

    expect(view).toMatchObject({
      monday: '2026-09-21',
      label: 'Semaine du 21 au 25 septembre',
      shortLabel: '21 – 25 sept.',
      relative: { long: 'il y a 2 semaines' },
    });
  });
});
