import type {
  GradeAverage,
  GradeCourse,
  GradeCourses,
  GradeQuery,
} from '../app/core/api/grades.contract';
import { TERM, selectionFixture } from './grades-terms.fixture';
import {
  CHEMISTRY_PASSED,
  COURSE,
  ENGLISH_AVERAGE,
  FRENCH_EXCUSED,
  GEOGRAPHY_FAILED,
  HISTORY_UNEXCUSED,
  MATHS_HOMEWORK_PASSED,
  MATHS_PENDING,
  PHYSICS_PENDING,
} from './grades-week.fixture';

/** Moyenne au ton que le serveur lui donne (60 % et 50 %). */
function average(percent: number, obtained: number, max: number): GradeAverage {
  const state = percent >= 60 ? 'PASSED' : percent >= 50 ? 'AVERAGE' : 'FAILED';
  return { percent, obtained, max, state };
}

/** Mes cours de Grâce, 1er trimestre · 1re période, dans l'ordre du bulletin. */
export const COURSES: readonly GradeCourse[] = [
  {
    courseId: COURSE.maths,
    subjectLabel: 'Mathématiques',
    subjectCode: 'MATH',
    teacherLabel: 'M. Kasongo',
    order: 1,
    average: average(75, 15, 20),
    count: 2,
    last: { points: 15, maxPoints: 20, date: '2026-09-14' },
    evaluations: [MATHS_PENDING, MATHS_HOMEWORK_PASSED],
  },
  {
    courseId: COURSE.french,
    subjectLabel: 'Français',
    subjectCode: 'FRA',
    teacherLabel: 'Mme Tshala',
    order: 2,
    average: null,
    count: 1,
    last: null,
    evaluations: [FRENCH_EXCUSED],
  },
  {
    courseId: COURSE.chemistry,
    subjectLabel: 'Chimie',
    subjectCode: 'CHIM',
    teacherLabel: 'M. Ilunga',
    order: 3,
    average: average(67.5, 13.5, 20),
    count: 1,
    last: { points: 13.5, maxPoints: 20, date: '2026-09-15' },
    evaluations: [CHEMISTRY_PASSED],
  },
  {
    courseId: COURSE.geography,
    subjectLabel: 'Géographie',
    subjectCode: 'GEO',
    teacherLabel: null,
    order: 4,
    average: average(45, 9, 20),
    count: 1,
    last: { points: 9, maxPoints: 20, date: '2026-09-16' },
    evaluations: [GEOGRAPHY_FAILED],
  },
  {
    courseId: COURSE.english,
    subjectLabel: 'Anglais',
    subjectCode: 'ANG',
    teacherLabel: 'Mme Mbuyi',
    order: 5,
    average: average(55, 5.5, 10),
    count: 1,
    last: { points: 5.5, maxPoints: 10, date: '2026-09-18' },
    evaluations: [ENGLISH_AVERAGE],
  },
  {
    courseId: COURSE.history,
    subjectLabel: 'Histoire',
    subjectCode: 'HIST',
    teacherLabel: 'M. Lukusa',
    order: 6,
    average: average(0, 0, 20),
    count: 1,
    last: { points: 0, maxPoints: 20, date: '2026-09-18' },
    evaluations: [HISTORY_UNEXCUSED],
  },
  {
    courseId: COURSE.physics,
    subjectLabel: 'Physique',
    subjectCode: 'PHY',
    teacherLabel: 'M. Kabeya',
    order: 7,
    average: null,
    count: 1,
    last: null,
    evaluations: [PHYSICS_PENDING],
  },
  {
    courseId: COURSE.civics,
    subjectLabel: 'Éducation civique',
    subjectCode: 'EDC',
    teacherLabel: null,
    order: 8,
    average: null,
    count: 0,
    last: null,
    evaluations: [],
  },
];

const DEFAULT = { periodId: TERM.first, part: 'FIRST' } as const;

/**
 * Mes cours pour une sélection (par défaut, la 1re période en cours) : la 1re période et tout le
 * 1er trimestre portent les notes ; toute autre sélection n'est pas encore cotée, chaque cours
 * reste listé sans évaluation.
 */
export function gradeCoursesFixture(query: GradeQuery = {}): GradeCourses {
  const selection = selectionFixture(query, DEFAULT);
  const graded =
    selection.periodId === TERM.first && (selection.part === 'FIRST' || selection.part === 'ALL');
  return {
    selection,
    courses: graded
      ? COURSES
      : COURSES.map((course) => ({
          ...course,
          average: null,
          count: 0,
          last: null,
          evaluations: [],
        })),
  };
}
