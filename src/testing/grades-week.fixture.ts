import type { GradeWeek, GradedEvaluation } from '../app/core/api/grades.contract';
import {
  CHEMISTRY_GRADED,
  FRENCH_ABSENT,
  GEOGRAPHY_LOW,
  MATHS_AWAITING,
} from './assessments.fixture';
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

export const MATHS_HOMEWORK_PASSED: GradedEvaluation = {
  evaluationId: MATHS_GRADED.evaluationId,
  courseId: COURSE.maths,
  kind: 'HOMEWORK',
  title: 'Devoir de Mathématiques — les fractions',
  subjectLabel: 'Mathématiques',
  subjectCode: 'MATH',
  date: '2026-09-14',
  notions: ['Fractions équivalentes', 'PPCM'],
  state: 'PASSED',
  points: 15,
  maxPoints: 20,
  gradeChangedAt: null,
};

export const CHEMISTRY_PASSED: GradedEvaluation = {
  evaluationId: CHEMISTRY_GRADED.evaluationId,
  courseId: COURSE.chemistry,
  kind: 'INTERRO',
  title: 'Interrogation de Chimie — les acides',
  subjectLabel: 'Chimie',
  subjectCode: 'CHIM',
  date: '2026-09-15',
  notions: ['Acides et bases', 'pH'],
  state: 'PASSED',
  points: 13.5,
  maxPoints: 20,
  gradeChangedAt: null,
};

export const GEOGRAPHY_FAILED: GradedEvaluation = {
  evaluationId: GEOGRAPHY_LOW.evaluationId,
  courseId: COURSE.geography,
  kind: 'INTERRO',
  title: 'Interrogation de Géographie — les fleuves du Congo',
  subjectLabel: 'Géographie',
  subjectCode: 'GEO',
  date: '2026-09-16',
  notions: ['Bassin du Congo', 'Affluents'],
  state: 'FAILED',
  points: 9,
  maxPoints: 20,
  gradeChangedAt: '2026-09-29T10:00:00Z',
};

export const FRENCH_EXCUSED: GradedEvaluation = {
  evaluationId: FRENCH_ABSENT.evaluationId,
  courseId: COURSE.french,
  kind: 'EXAMEN',
  title: 'Examen de Français — rédaction',
  subjectLabel: 'Français',
  subjectCode: 'FRA',
  date: '2026-09-17',
  notions: ['Rédaction argumentée'],
  state: 'ABSENT_EXCUSED',
  points: null,
  maxPoints: 40,
  gradeChangedAt: null,
};

export const ENGLISH_AVERAGE: GradedEvaluation = {
  evaluationId: '41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a11',
  courseId: COURSE.english,
  kind: 'INTERRO',
  title: 'Interrogation d’Anglais — le prétérit',
  subjectLabel: 'Anglais',
  subjectCode: 'ANG',
  date: '2026-09-18',
  notions: ['Prétérit simple'],
  state: 'AVERAGE',
  points: 5.5,
  maxPoints: 10,
  gradeChangedAt: null,
};

export const HISTORY_UNEXCUSED: GradedEvaluation = {
  evaluationId: '41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a12',
  courseId: COURSE.history,
  kind: 'INTERRO',
  title: 'Interrogation d’Histoire — le royaume Kongo',
  subjectLabel: 'Histoire',
  subjectCode: 'HIST',
  date: '2026-09-18',
  notions: ['Royaume Kongo'],
  state: 'ABSENT_UNEXCUSED',
  points: 0,
  maxPoints: 20,
  gradeChangedAt: null,
};

export const PHYSICS_PENDING: GradedEvaluation = {
  evaluationId: '41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a13',
  courseId: COURSE.physics,
  kind: 'INTERRO',
  title: 'Interrogation de Physique — les forces',
  subjectLabel: 'Physique',
  subjectCode: 'PHY',
  date: '2026-09-18',
  notions: ['Forces et mouvement'],
  state: 'PENDING',
  points: null,
  maxPoints: 20,
  gradeChangedAt: null,
};

export const MATHS_PENDING: GradedEvaluation = {
  evaluationId: MATHS_AWAITING.evaluationId,
  courseId: COURSE.maths,
  kind: 'INTERRO',
  title: 'Interrogation de Mathématiques — les fractions',
  subjectLabel: 'Mathématiques',
  subjectCode: 'MATH',
  date: '2026-09-21',
  notions: ['Fractions', 'Simplification'],
  state: 'PENDING',
  points: null,
  maxPoints: 20,
  gradeChangedAt: null,
};

/** Semaine du 14 au 18 septembre : les six états. */
export const FULL_WEEK: readonly GradedEvaluation[] = [
  MATHS_HOMEWORK_PASSED,
  CHEMISTRY_PASSED,
  GEOGRAPHY_FAILED,
  FRENCH_EXCUSED,
  ENGLISH_AVERAGE,
  HISTORY_UNEXCUSED,
  PHYSICS_PENDING,
];

const BOUNDS = { firstWeekStart: '2026-09-07', currentWeekStart: '2026-09-21' } as const;

/** La semaine qui contient `date` (par défaut la semaine en cours), comme la rend le serveur. */
export function gradeWeekFixture(date = '2026-09-22'): GradeWeek {
  if (date >= '2026-09-14' && date <= '2026-09-20') {
    return {
      ...BOUNDS,
      from: '2026-09-14',
      to: '2026-09-18',
      lastEvaluationDate: '2026-09-18',
      counts: { total: 7, graded: 5, pending: 1 },
      items: FULL_WEEK,
    };
  }
  if (date >= '2026-09-21') {
    return {
      ...BOUNDS,
      from: '2026-09-21',
      to: '2026-09-25',
      lastEvaluationDate: '2026-09-21',
      counts: { total: 1, graded: 0, pending: 1 },
      items: [MATHS_PENDING],
    };
  }
  return {
    ...BOUNDS,
    from: '2026-09-07',
    to: '2026-09-11',
    lastEvaluationDate: null,
    counts: { total: 0, graded: 0, pending: 0 },
    items: [],
  };
}
