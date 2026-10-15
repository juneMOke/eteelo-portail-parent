import type { GradeCard, GradeWeek } from '../app/core/api/grades.contract';
import {
  CHEMISTRY_GRADED,
  FRENCH_ABSENT,
  GEOGRAPHY_LOW,
  MATHS_AWAITING,
} from './assessments.fixture';
import { GRACE } from './bootstrap.fixture';
import { MATHS_GRADED } from './homework.fixture';

/**
 * Évaluations notées de Grâce (contrat Mes notes, lots P10 à P12). Partagées par les tests
 * unitaires, le serveur factice et les parcours Playwright. Les identifiants reprennent ceux des
 * fiches de Mes évaluations et Mes devoirs, pour que les cartes y mènent.
 * Aujourd'hui : mardi 22 septembre 2026 ; rentrée le lundi 7 septembre.
 */
export const COURSE = {
  maths: 'c0a1b2c3-0000-4000-8000-000000000001',
  french: 'c0a1b2c3-0000-4000-8000-000000000002',
  chemistry: 'c0a1b2c3-0000-4000-8000-000000000003',
  geography: 'c0a1b2c3-0000-4000-8000-000000000004',
  english: 'c0a1b2c3-0000-4000-8000-000000000005',
  history: 'c0a1b2c3-0000-4000-8000-000000000006',
  physics: 'c0a1b2c3-0000-4000-8000-000000000007',
  civics: 'c0a1b2c3-0000-4000-8000-000000000008',
} as const;

export const MATHS_HOMEWORK_PASSED: GradeCard = {
  evaluationId: MATHS_GRADED.evaluationId,
  courseId: COURSE.maths,
  kind: 'HOMEWORK',
  title: 'Devoir de Mathématiques — les fractions',
  subjectLabel: 'Mathématiques',
  subjectCode: 'MATH',
  date: '2026-09-14',
  topics: ['Fractions équivalentes', 'PPCM'],
  state: 'PASSED',
  points: 15,
  maxPoints: 20,
  revisedAt: null,
  href: `/api/v1/parent/children/${GRACE.childId}/homework/${MATHS_GRADED.evaluationId}`,
};

export const CHEMISTRY_PASSED: GradeCard = {
  evaluationId: CHEMISTRY_GRADED.evaluationId,
  courseId: COURSE.chemistry,
  kind: 'TEST',
  title: 'Interrogation de Chimie — les acides',
  subjectLabel: 'Chimie',
  subjectCode: 'CHIM',
  date: '2026-09-15',
  topics: ['Acides et bases', 'pH'],
  state: 'PASSED',
  points: 13.5,
  maxPoints: 20,
  revisedAt: null,
  href: `/api/v1/parent/children/${GRACE.childId}/evaluations/${CHEMISTRY_GRADED.evaluationId}`,
};

export const GEOGRAPHY_FAILED: GradeCard = {
  evaluationId: GEOGRAPHY_LOW.evaluationId,
  courseId: COURSE.geography,
  kind: 'TEST',
  title: 'Interrogation de Géographie — les fleuves du Congo',
  subjectLabel: 'Géographie',
  subjectCode: 'GEO',
  date: '2026-09-16',
  topics: ['Bassin du Congo', 'Affluents'],
  state: 'FAILED',
  points: 9,
  maxPoints: 20,
  revisedAt: '2026-09-29T10:00:00Z',
  href: `/api/v1/parent/children/${GRACE.childId}/evaluations/${GEOGRAPHY_LOW.evaluationId}`,
};

export const FRENCH_EXCUSED: GradeCard = {
  evaluationId: FRENCH_ABSENT.evaluationId,
  courseId: COURSE.french,
  kind: 'EXAM',
  title: 'Examen de Français — rédaction',
  subjectLabel: 'Français',
  subjectCode: 'FRA',
  date: '2026-09-17',
  topics: ['Rédaction argumentée'],
  state: 'ABSENT_EXCUSED',
  points: null,
  maxPoints: 40,
  revisedAt: null,
  href: `/api/v1/parent/children/${GRACE.childId}/evaluations/${FRENCH_ABSENT.evaluationId}`,
};

export const ENGLISH_AVERAGE: GradeCard = {
  evaluationId: '41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a11',
  courseId: COURSE.english,
  kind: 'TEST',
  title: 'Interrogation d’Anglais — le prétérit',
  subjectLabel: 'Anglais',
  subjectCode: 'ANG',
  date: '2026-09-18',
  topics: ['Prétérit simple'],
  state: 'AVERAGE',
  points: 5.5,
  maxPoints: 10,
  revisedAt: null,
  href: `/api/v1/parent/children/${GRACE.childId}/evaluations/41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a11`,
};

export const HISTORY_UNEXCUSED: GradeCard = {
  evaluationId: '41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a12',
  courseId: COURSE.history,
  kind: 'TEST',
  title: 'Interrogation d’Histoire — le royaume Kongo',
  subjectLabel: 'Histoire',
  subjectCode: 'HIST',
  date: '2026-09-18',
  topics: ['Royaume Kongo'],
  state: 'ABSENT_UNEXCUSED',
  points: 0,
  maxPoints: 20,
  revisedAt: null,
  href: `/api/v1/parent/children/${GRACE.childId}/evaluations/41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a12`,
};

export const PHYSICS_PENDING: GradeCard = {
  evaluationId: '41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a13',
  courseId: COURSE.physics,
  kind: 'TEST',
  title: 'Interrogation de Physique — les forces',
  subjectLabel: 'Physique',
  subjectCode: 'PHY',
  date: '2026-09-18',
  topics: ['Forces et mouvement'],
  state: 'PENDING',
  points: null,
  maxPoints: 20,
  revisedAt: null,
  href: `/api/v1/parent/children/${GRACE.childId}/evaluations/41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a13`,
};

export const MATHS_PENDING: GradeCard = {
  evaluationId: MATHS_AWAITING.evaluationId,
  courseId: COURSE.maths,
  kind: 'TEST',
  title: 'Interrogation de Mathématiques — les fractions',
  subjectLabel: 'Mathématiques',
  subjectCode: 'MATH',
  date: '2026-09-21',
  topics: ['Fractions', 'Simplification'],
  state: 'PENDING',
  points: null,
  maxPoints: 20,
  revisedAt: null,
  href: `/api/v1/parent/children/${GRACE.childId}/evaluations/${MATHS_AWAITING.evaluationId}`,
};

const BOUNDS = { firstWeek: '2026-09-07', currentWeek: '2026-09-21' } as const;

/** La semaine qui contient `weekOf` (par défaut la semaine en cours), comme la rend le serveur. */
export function gradeWeekFixture(weekOf = '2026-09-22'): GradeWeek {
  if (weekOf >= '2026-09-14' && weekOf <= '2026-09-20') {
    return {
      ...BOUNDS,
      weekStart: '2026-09-14',
      weekEnd: '2026-09-19',
      lastEvaluationDate: null,
      summary: { total: 7, graded: 6, pending: 1 },
      days: [
        { date: '2026-09-14', items: [MATHS_HOMEWORK_PASSED] },
        { date: '2026-09-15', items: [CHEMISTRY_PASSED] },
        { date: '2026-09-16', items: [GEOGRAPHY_FAILED] },
        { date: '2026-09-17', items: [FRENCH_EXCUSED] },
        { date: '2026-09-18', items: [ENGLISH_AVERAGE, HISTORY_UNEXCUSED, PHYSICS_PENDING] },
      ],
    };
  }
  if (weekOf >= '2026-09-21') {
    return {
      ...BOUNDS,
      weekStart: '2026-09-21',
      weekEnd: '2026-09-26',
      lastEvaluationDate: null,
      summary: { total: 1, graded: 0, pending: 1 },
      days: [{ date: '2026-09-21', items: [MATHS_PENDING] }],
    };
  }
  return {
    ...BOUNDS,
    weekStart: '2026-09-07',
    weekEnd: '2026-09-12',
    lastEvaluationDate: null,
    summary: { total: 0, graded: 0, pending: 0 },
    days: [],
  };
}
