import type {
  EvaluationDetail,
  EvaluationList,
  EvaluationSummary,
} from '../app/core/api/assignments.contract';
import { GRACE } from './bootstrap.fixture';

/**
 * Mes évaluations de Grâce, telles que les rend le serveur (contrat P5). Partagées par les
 * tests unitaires, le serveur factice (`npm run start:mock`) et les parcours Playwright.
 * Aujourd'hui : mardi 22 septembre 2026 ; école du lundi au vendredi.
 */
export const CHEMISTRY_GRADED: EvaluationSummary = {
  evaluationId: '41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a01',
  type: 'INTERRO',
  title: 'Interrogation de Chimie — les acides',
  subjectLabel: 'Chimie',
  teacherLabel: 'M. Ilunga',
  date: '2026-09-15',
  durationMinutes: 45,
  status: 'GRADED',
  points: 13.5,
  maxPoints: 20,
};

export const GEOGRAPHY_LOW: EvaluationSummary = {
  evaluationId: '41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a02',
  type: 'INTERRO',
  title: 'Interrogation de Géographie — les fleuves du Congo',
  subjectLabel: 'Géographie',
  teacherLabel: null,
  date: '2026-09-16',
  durationMinutes: null,
  status: 'GRADED',
  points: 9,
  maxPoints: 20,
};

export const FRENCH_ABSENT: EvaluationSummary = {
  evaluationId: '41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a03',
  type: 'EXAMEN',
  title: 'Examen de Français — rédaction',
  subjectLabel: 'Français',
  teacherLabel: 'Mme Tshala',
  date: '2026-09-17',
  durationMinutes: 120,
  status: 'ABSENT',
  points: null,
  maxPoints: 40,
};

export const MATHS_AWAITING: EvaluationSummary = {
  evaluationId: '41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a04',
  type: 'INTERRO',
  title: 'Interrogation de Mathématiques — les fractions',
  subjectLabel: 'Mathématiques',
  teacherLabel: 'M. Kasongo',
  date: '2026-09-21',
  durationMinutes: 50,
  status: 'AWAITING_GRADE',
  points: null,
  maxPoints: 20,
};

export const CHEMISTRY_UPCOMING: EvaluationSummary = {
  evaluationId: '41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a05',
  type: 'INTERRO',
  title: 'Interrogation de Chimie — les bases',
  subjectLabel: 'Chimie',
  teacherLabel: 'M. Ilunga',
  date: '2026-09-24',
  durationMinutes: 45,
  status: 'UPCOMING',
  points: null,
  maxPoints: 20,
};

export const HISTORY_UPCOMING: EvaluationSummary = {
  evaluationId: '41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a06',
  type: 'EXAMEN',
  title: 'Examen d’Histoire — la période coloniale',
  subjectLabel: 'Histoire',
  teacherLabel: 'Mme Mbuyi',
  date: '2026-09-24',
  durationMinutes: 120,
  status: 'UPCOMING',
  points: null,
  maxPoints: 40,
};

export const ENGLISH_UPCOMING: EvaluationSummary = {
  evaluationId: '41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a07',
  type: 'EXAMEN',
  title: 'Examen d’Anglais — compréhension écrite',
  subjectLabel: 'Anglais',
  teacherLabel: 'M. Lukusa',
  date: '2026-10-02',
  durationMinutes: 90,
  status: 'UPCOMING',
  points: null,
  maxPoints: 20,
};

export const EVALUATIONS: readonly EvaluationSummary[] = [
  CHEMISTRY_GRADED,
  GEOGRAPHY_LOW,
  FRENCH_ABSENT,
  MATHS_AWAITING,
  CHEMISTRY_UPCOMING,
  HISTORY_UPCOMING,
  ENGLISH_UPCOMING,
];

export function evaluationListFixture(
  items: readonly EvaluationSummary[] = EVALUATIONS,
): EvaluationList {
  return {
    from: '2026-09-01',
    to: '2026-10-20',
    today: '2026-09-22',
    schoolDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    items,
  };
}

const ANSWER_KEY_HREF = `/api/v1/parent/children/${GRACE.childId}/evaluations/${CHEMISTRY_GRADED.evaluationId}/answer-key`;

const DETAILS: Readonly<Record<string, Omit<EvaluationDetail, keyof EvaluationSummary>>> = {
  [CHEMISTRY_GRADED.evaluationId]: {
    // Cours de Chimie dans Mes notes (`COURSE.chemistry` de grades-week.fixture).
    courseId: 'c0a1b2c3-0000-4000-8000-000000000003',
    announcedAt: '2026-09-08T09:12:00Z',
    programme: ['Les acides et leurs propriétés', 'Le pH', 'Les indicateurs colorés'],
    instructions: 'Calculatrice non autorisée.',
    questions: [
      { number: 1, statement: 'Donnez la définition d’un acide selon Arrhenius.', points: 4 },
      {
        number: 2,
        statement: 'Calculez le pH d’une solution de concentration 0,01 mol/L.',
        points: 8,
      },
      { number: 3, statement: 'Citez deux indicateurs colorés et leur zone de virage.', points: 8 },
    ],
    result: {
      points: 13.5,
      maxPoints: 20,
      classAverage: 11.5,
      gradedAt: '2026-09-21T14:30:00Z',
      teacherComment: 'Bonne maîtrise du pH. Revoir les zones de virage des indicateurs.',
      absenceJustified: null,
    },
    documents: [
      {
        kind: 'ANSWER_KEY',
        fileName: 'CE-Chimie-2026-09-15.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1_258_291,
        publishedAt: '2026-09-21T14:30:00Z',
        href: ANSWER_KEY_HREF,
      },
    ],
  },
  [GEOGRAPHY_LOW.evaluationId]: {
    announcedAt: '2026-09-09T08:00:00Z',
    programme: ['Le fleuve Congo et ses affluents'],
    instructions: null,
    questions: [],
    result: {
      points: 9,
      maxPoints: 20,
      classAverage: null,
      gradedAt: '2026-09-21T10:00:00Z',
      teacherComment: null,
      absenceJustified: null,
    },
    documents: [],
  },
  [FRENCH_ABSENT.evaluationId]: {
    announcedAt: '2026-09-03T08:00:00Z',
    programme: ['La rédaction argumentée', 'Le plan en trois parties'],
    instructions: 'Deux pages manuscrites.',
    questions: [],
    result: {
      points: null,
      maxPoints: 40,
      classAverage: 24.5,
      gradedAt: '2026-09-21T16:00:00Z',
      teacherComment: 'Rattrapage prévu le vendredi 2 octobre en salle 4.',
      absenceJustified: false,
    },
    documents: [],
  },
  [MATHS_AWAITING.evaluationId]: {
    announcedAt: '2026-09-14T08:00:00Z',
    programme: ['Addition et soustraction de fractions', 'Simplifier une fraction'],
    instructions: 'Calculatrice non autorisée.',
    questions: [],
    result: null,
    documents: [],
  },
  [CHEMISTRY_UPCOMING.evaluationId]: {
    announcedAt: '2026-09-17T08:00:00Z',
    programme: ['Les bases et leurs propriétés', 'La neutralisation', 'Le pH d’une base'],
    instructions: 'Calculatrice autorisée.',
    questions: [],
    result: null,
    documents: [],
  },
  [HISTORY_UPCOMING.evaluationId]: {
    announcedAt: '2026-09-10T08:00:00Z',
    programme: [],
    instructions: null,
    questions: [],
    result: null,
    documents: [],
  },
  [ENGLISH_UPCOMING.evaluationId]: {
    announcedAt: '2026-09-18T08:00:00Z',
    programme: ['Reading comprehension', 'Vocabulary: school and family'],
    instructions: 'Dictionnaire non autorisé.',
    questions: [],
    result: null,
    documents: [],
  },
};

/** Fiche d'une épreuve de la liste ; undefined pour un id inconnu (le serveur répond 404). */
export function evaluationDetailFixture(evaluationId: string): EvaluationDetail | undefined {
  const summary = EVALUATIONS.find((item) => item.evaluationId === evaluationId);
  const detail = DETAILS[evaluationId];
  return summary && detail ? { ...summary, ...detail } : undefined;
}
