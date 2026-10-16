import type {
  AttendanceDay,
  AttendanceMonth,
  ChildAttendance,
} from '../app/core/api/conduct.contract';
import { addDays, civilToDate, monthOf } from '../app/shared/date/civil-date';

/**
 * Présence de Grâce (contrat Ma présence), du 1er septembre au mardi 6 octobre 2026, jour de
 * l'école où l'appel n'est pas encore fait. Partagée par les tests unitaires, le serveur
 * factice et les parcours Playwright.
 */
export const ATTENDANCE_TODAY = '2026-10-06';
export const CASE_ID = {
  absence: 'c1000000-0000-4000-8000-000000000001',
  lateness: 'c1000000-0000-4000-8000-000000000002',
  talking: 'c1000000-0000-4000-8000-000000000003',
} as const;
const FIRST_TERM = 'a1000000-0000-4000-8000-000000000001';

export function attendanceDay(date: string, changes: Partial<AttendanceDay> = {}): AttendanceDay {
  return {
    date,
    status: 'PRESENT',
    justified: null,
    absenceReason: null,
    absenceReasonNote: null,
    arrivalTime: null,
    lateMinutes: null,
    recordedBy: 'Jean Ilunga',
    recordedAt: `${date}T06:40:00Z`,
    justifyUntil: null,
    justification: null,
    disciplinaryCases: [],
    ...changes,
  };
}

const late = (date: string, arrivalTime: string, lateMinutes: number) =>
  attendanceDay(date, { status: 'LATE', arrivalTime, lateMinutes });
const absent = (date: string, changes: Partial<AttendanceDay> = {}) =>
  attendanceDay(date, {
    status: 'ABSENT',
    justified: false,
    absenceReason: 'UNJUSTIFIED',
    ...changes,
  });

const SPECIAL_DAYS: readonly AttendanceDay[] = [
  absent('2026-09-10', {
    justified: true,
    absenceReason: 'SICKNESS',
    absenceReasonNote: 'Certificat reçu le 10/09',
  }),
  late('2026-09-14', '07:45', 15),
  absent('2026-09-16', {
    disciplinaryCases: [{ id: CASE_ID.absence, sanction: 'WRITTEN_WARNING', periodId: FIRST_TERM }],
  }),
  late('2026-09-18', '07:52', 22),
  late('2026-09-21', '07:50', 20),
  absent('2026-09-29', {
    justifyUntil: '2026-10-06',
    justification: {
      status: 'REJECTED',
      reason: 'SICKNESS',
      submittedAt: '2026-09-29T08:00:00Z',
      decidedAt: '2026-10-01T09:00:00Z',
      decisionNote: 'Le certificat est illisible.',
    },
  }),
  absent('2026-10-02', { justifyUntil: '2026-10-09' }),
  absent('2026-10-05', {
    justifyUntil: '2026-10-12',
    justification: {
      status: 'PENDING',
      reason: 'TRANSPORT',
      submittedAt: '2026-10-05T07:30:00Z',
      decidedAt: null,
      decisionNote: null,
    },
  }),
];

function isWeekday(date: string): boolean {
  const weekday = civilToDate(date).getUTCDay();
  return weekday !== 0 && weekday !== 6;
}

/** Les jours appelés, du lundi au vendredi, du `from` à la veille de `to`. */
function calledDays(from: string, to: string): AttendanceDay[] {
  const days: AttendanceDay[] = [];
  for (let date = from; date < to; date = addDays(date, 1)) {
    if (!isWeekday(date)) continue;
    days.push(SPECIAL_DAYS.find((day) => day.date === date) ?? attendanceDay(date));
  }
  return days;
}

/** Ce que compte le serveur (A1) ; ici recompté sur les jours factices. */
function monthsOf(days: readonly AttendanceDay[]): AttendanceMonth[] {
  const months = new Map<string, AttendanceMonth>();
  for (const day of days) {
    const month = monthOf(day.date);
    const known = months.get(month) ?? { month, calledDays: 0, absences: 0, lates: 0 };
    months.set(month, {
      month,
      calledDays: known.calledDays + 1,
      absences: known.absences + (day.status === 'ABSENT' ? 1 : 0),
      lates: known.lates + (day.status === 'LATE' ? 1 : 0),
    });
  }
  return [...months.values()];
}

export function attendanceFixture(
  days = calledDays('2026-09-01', ATTENDANCE_TODAY),
): ChildAttendance {
  const count = (test: (day: AttendanceDay) => boolean) => days.filter(test).length;
  const presentDays = count((day) => day.status !== 'ABSENT');
  return {
    from: '2026-09-01',
    to: ATTENDANCE_TODAY,
    summary: {
      schoolDays: days.length,
      presentDays,
      lateDays: count((day) => day.status === 'LATE'),
      justifiedAbsenceDays: count((day) => day.status === 'ABSENT' && !!day.justified),
      unjustifiedAbsenceDays: count((day) => day.status === 'ABSENT' && !day.justified),
      presenceRate: days.length ? presentDays / days.length : 0,
    },
    months: monthsOf(days),
    toJustify: days
      .filter((day) => day.justifyUntil && day.justification?.status !== 'PENDING')
      .map((day) => ({ date: day.date, justifyUntil: day.justifyUntil! })),
    days,
  };
}

/** Début d'année : aucun appel encore enregistré. */
export function emptyAttendanceFixture(): ChildAttendance {
  return attendanceFixture([]);
}

/** Ce que rend le serveur après une justification reçue : le jour attend la décision de l'école. */
export function withPendingJustification(
  attendance: ChildAttendance,
  date: string,
  reason = 'SICKNESS',
): ChildAttendance {
  const days = attendance.days.map((day) =>
    day.date === date
      ? {
          ...day,
          justification: {
            status: 'PENDING',
            reason,
            submittedAt: `${ATTENDANCE_TODAY}T08:00:00Z`,
            decidedAt: null,
            decisionNote: null,
          },
        }
      : day,
  );
  return {
    ...attendance,
    days,
    toJustify: attendance.toJustify.filter((entry) => entry.date !== date),
  };
}
