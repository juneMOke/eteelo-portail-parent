import type { CourseGrades, GradeCourses, TermQuery } from '../app/core/api/grades.contract';
import { PERIOD, TERM, termTreeFixture } from './grades-terms.fixture';
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

/** Mes cours de Grâce, 1er trimestre · 1re période, dans l'ordre du bulletin. */
export const COURSES: readonly CourseGrades[] = [
  {
    courseId: COURSE.maths,
    label: 'Mathématiques',
    subjectCode: 'MATH',
    teacherLabel: 'M. Kasongo',
    average: { percent: 75, obtained: 15, max: 20 },
    evaluationCount: 2,
    last: { points: 15, maxPoints: 20, date: '2026-09-14' },
    evaluations: [MATHS_PENDING, MATHS_HOMEWORK_PASSED],
  },
  {
    courseId: COURSE.french,
    label: 'Français',
    subjectCode: 'FRA',
    teacherLabel: 'Mme Tshala',
    average: null,
    evaluationCount: 1,
    last: null,
    evaluations: [FRENCH_EXCUSED],
  },
  {
    courseId: COURSE.chemistry,
    label: 'Chimie',
    subjectCode: 'CHIM',
    teacherLabel: 'M. Ilunga',
    average: { percent: 67.5, obtained: 13.5, max: 20 },
    evaluationCount: 1,
    last: { points: 13.5, maxPoints: 20, date: '2026-09-15' },
    evaluations: [CHEMISTRY_PASSED],
  },
  {
    courseId: COURSE.geography,
    label: 'Géographie',
    subjectCode: 'GEO',
    teacherLabel: null,
    average: { percent: 45, obtained: 9, max: 20 },
    evaluationCount: 1,
    last: { points: 9, maxPoints: 20, date: '2026-09-16' },
    evaluations: [GEOGRAPHY_FAILED],
  },
  {
    courseId: COURSE.english,
    label: 'Anglais',
    subjectCode: 'ANG',
    teacherLabel: 'Mme Mbuyi',
    average: { percent: 55, obtained: 5.5, max: 10 },
    evaluationCount: 1,
    last: { points: 5.5, maxPoints: 10, date: '2026-09-18' },
    evaluations: [ENGLISH_AVERAGE],
  },
  {
    courseId: COURSE.history,
    label: 'Histoire',
    subjectCode: 'HIST',
    teacherLabel: 'M. Lukusa',
    average: { percent: 0, obtained: 0, max: 20 },
    evaluationCount: 1,
    last: { points: 0, maxPoints: 20, date: '2026-09-18' },
    evaluations: [HISTORY_UNEXCUSED],
  },
  {
    courseId: COURSE.physics,
    label: 'Physique',
    subjectCode: 'PHY',
    teacherLabel: 'M. Kabeya',
    average: null,
    evaluationCount: 1,
    last: null,
    evaluations: [PHYSICS_PENDING],
  },
  {
    courseId: COURSE.civics,
    label: 'Éducation civique',
    subjectCode: 'EDC',
    teacherLabel: null,
    average: null,
    evaluationCount: 0,
    last: null,
    evaluations: [],
  },
];

const DEFAULT = { termId: TERM.first, periodId: PERIOD.first } as const;

/**
 * Mes cours pour une sélection : la 1re période (par défaut) porte les notes ; toute autre
 * sélection n'est pas encore cotée, chaque cours reste listé sans évaluation.
 */
export function gradeCoursesFixture(query: TermQuery = {}): GradeCourses {
  const tree = termTreeFixture(query, DEFAULT);
  const graded = tree.selection.periodId === PERIOD.first || tree.selection.periodId === null;
  return {
    ...tree,
    courses: graded
      ? COURSES
      : COURSES.map((course) => ({
          ...course,
          average: null,
          evaluationCount: 0,
          last: null,
          evaluations: [],
        })),
  };
}
