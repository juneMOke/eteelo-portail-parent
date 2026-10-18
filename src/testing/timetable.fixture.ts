import type {
  TimetableBreak,
  TimetableCourse,
  TimetableDay,
  TimetableItem,
  TimetableWeek,
} from '../app/core/api/timetable.contract';
import { addDays, mondayOf } from '../app/shared/date/civil-date';
import { CHEMISTRY_UPCOMING, HISTORY_UPCOMING } from './assessments.fixture';
import { DAVID } from './bootstrap.fixture';

/**
 * Mon emploi du temps de Grâce (contrat T1), partagé par les tests unitaires, le serveur factice
 * et les parcours Playwright. Aujourd'hui : mardi 22 septembre 2026, 10 h 30 à Kinshasa
 * (Mathématiques en cours). Le jeudi 24 porte l'interrogation de Chimie et l'examen d'Histoire de
 * Mes évaluations. Le vendredi 2 octobre n'a aucun cours. David n'est pas placé : son emploi du
 * temps n'est pas publié.
 */
export const TIMETABLE_TODAY = '2026-09-22';
export const TIMETABLE_WEEK = '2026-09-21';
export const TIMETABLE_WINDOW = { from: '2026-09-07', to: '2027-07-02' } as const;
/** Le vendredi sans cours, et le jour d'école qui le suit. */
export const EMPTY_DAY = '2026-10-02';

const TEACHERS = {
  maths: 'Ilunga Mbuyi Jean',
  french: 'Nsimba Kiese Marie',
  english: 'Lokwa Bofaya Ruth',
  sciences: 'Nsimba Kiese Marie',
  geography: 'Kasongo Tshibangu Paul',
  chemistry: 'Kalala Mukendi Pierre',
  history: 'Mbuyi Ngalula Anne',
  civics: null,
};

type Subject = keyof typeof TEACHERS;

const SUBJECTS: Record<Subject, { code: string | null; label: string; room: string | null }> = {
  maths: { code: 'NUM', label: 'Mathématiques', room: 'Salle 12' },
  french: { code: 'FRA', label: 'Français', room: 'Salle 8' },
  english: { code: 'ANG', label: 'Anglais', room: 'Salle 8' },
  sciences: { code: 'SCI', label: 'Sciences', room: 'Salle 8' },
  geography: { code: 'GEO', label: 'Géographie', room: 'Salle 8' },
  chemistry: { code: 'CHIM', label: 'Chimie', room: 'Labo 2' },
  history: { code: 'HIST', label: 'Histoire', room: 'Salle 12' },
  civics: { code: null, label: 'Éducation civique', room: null },
};

function minutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}

export function course(
  subject: Subject,
  start: string,
  end: string,
  extra: Partial<TimetableCourse> = {},
): TimetableCourse {
  const { code, label, room } = SUBJECTS[subject];
  return {
    kind: 'COURSE',
    start,
    end,
    durationMinutes: minutes(end) - minutes(start),
    subjectCode: code,
    subjectLabel: label,
    teacherLabel: TEACHERS[subject],
    room,
    status: 'SCHEDULED',
    cancelReason: null,
    substituteTeacherLabel: null,
    newRoom: null,
    evaluation: null,
    ...extra,
  };
}

const RECESS: TimetableBreak = { kind: 'BREAK', start: '09:00', end: '09:20', label: 'Récréation' };

/** Une semaine type, du lundi au vendredi ; les épreuves seulement la semaine du 21. */
function weekItems(withEvaluations: boolean): TimetableItem[][] {
  return [
    [
      course('maths', '07:30', '09:00'),
      RECESS,
      course('french', '09:20', '10:05'),
      course('chemistry', '10:15', '11:00'),
      course('geography', '11:00', '11:45'),
    ],
    [
      course('french', '07:30', '08:15'),
      course('english', '08:15', '09:00'),
      RECESS,
      course('sciences', '09:20', '10:05'),
      course('maths', '10:15', '11:00'),
      course('geography', '11:00', '11:45'),
    ],
    [
      course('maths', '07:30', '08:15'),
      course('history', '08:15', '09:00'),
      RECESS,
      course('english', '09:20', '10:05'),
      course('french', '10:15', '11:45'),
    ],
    [
      course('chemistry', '07:30', '08:15', {
        evaluation: withEvaluations
          ? { id: CHEMISTRY_UPCOMING.evaluationId, type: 'INTERRO', durationMinutes: 45 }
          : null,
      }),
      course('english', '08:15', '09:00'),
      RECESS,
      course('sciences', '09:20', '10:05'),
      course('history', '10:15', '11:45', {
        evaluation: withEvaluations
          ? { id: HISTORY_UPCOMING.evaluationId, type: 'EXAMEN', durationMinutes: 120 }
          : null,
      }),
    ],
    [
      course('english', '07:30', '08:15'),
      course('geography', '08:15', '09:00'),
      RECESS,
      course('sciences', '09:20', '10:05'),
      course('civics', '10:15', '11:00'),
    ],
  ];
}

function schoolDay(date: string, items: TimetableItem[]): TimetableDay {
  const courses = items.filter((item): item is TimetableCourse => item.kind === 'COURSE');
  const held = courses.filter((item) => item.status !== 'CANCELLED');
  return {
    date,
    state: 'SCHOOL_DAY',
    holidayLabel: null,
    nextSchoolDay: held.length ? null : addDays(date, 3),
    courseCount: held.length,
    firstStart: held[0]?.start ?? null,
    lastEnd: held.at(-1)?.end ?? null,
    examCount: courses.filter((item) => item.evaluation).length,
    items,
  };
}

/** La semaine du jour demandé, dans la fenêtre ; null au-delà (le serveur répond 400). */
export function timetableFixture(week?: string, childId?: string): TimetableWeek | null {
  const weekStart = week ? mondayOf(week) : TIMETABLE_WEEK;
  if (addDays(weekStart, 4) < TIMETABLE_WINDOW.from || weekStart > TIMETABLE_WINDOW.to) {
    return null;
  }
  const published = childId !== DAVID.childId;
  const items = weekItems(weekStart === TIMETABLE_WEEK);
  const days = items.map((dayItems, index): TimetableDay => {
    const date = addDays(weekStart, index);
    if (!published) {
      return {
        ...schoolDay(date, []),
        state: 'NOT_PUBLISHED',
        nextSchoolDay: null,
      };
    }
    return schoolDay(date, date === EMPTY_DAY ? [] : dayItems);
  });
  return {
    today: TIMETABLE_TODAY,
    serverTime: '2026-09-22T09:30:00Z',
    timeZone: 'Africa/Kinshasa',
    weekStart,
    window: TIMETABLE_WINDOW,
    newTimetableFrom: null,
    courseCount: days.reduce((sum, day) => sum + day.courseCount, 0),
    days,
  };
}
