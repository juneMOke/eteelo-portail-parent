import type {
  HomeworkDetail,
  HomeworkList,
  HomeworkSummary,
} from '../app/core/api/assignments.contract';
import { GRACE } from './bootstrap.fixture';

/**
 * Mes devoirs de Grâce, tels que les rend le serveur (contrat P7). Partagés par les tests
 * unitaires, le serveur factice (`npm run start:mock`) et les parcours Playwright.
 * Aujourd'hui : mardi 22 septembre 2026 ; école du lundi au vendredi ; Kinshasa, UTC+1.
 */
export const MATHS_GRADED: HomeworkSummary = {
  evaluationId: '7d2b5c10-a1b2-4c3d-9e4f-5a6b7c8d9e01',
  title: 'Devoir de Mathématiques — les fractions',
  subjectLabel: 'Mathématiques',
  teacherLabel: 'M. Kasongo',
  dueDate: '2026-09-14',
  dueTime: '08:00',
  dueAt: '2026-09-14T07:00:00Z',
  deliveryMode: 'IN_CLASS',
  status: 'GRADED',
  points: 15,
  maxPoints: 20,
};

export const FRENCH_MISSED: HomeworkSummary = {
  evaluationId: '7d2b5c10-a1b2-4c3d-9e4f-5a6b7c8d9e02',
  title: 'Devoir de Français — résumé de texte',
  subjectLabel: 'Français',
  teacherLabel: 'Mme Tshala',
  dueDate: '2026-09-16',
  dueTime: '18:00',
  dueAt: '2026-09-16T17:00:00Z',
  deliveryMode: 'ONLINE',
  status: 'MISSED',
  points: null,
  maxPoints: 20,
};

export const HISTORY_AWAITING: HomeworkSummary = {
  evaluationId: '7d2b5c10-a1b2-4c3d-9e4f-5a6b7c8d9e03',
  title: 'Devoir d’Histoire — frise chronologique',
  subjectLabel: 'Histoire',
  teacherLabel: 'Mme Mbuyi',
  dueDate: '2026-09-21',
  dueTime: null,
  dueAt: '2026-09-21T22:59:59Z',
  deliveryMode: 'IN_CLASS',
  status: 'AWAITING_GRADE',
  points: null,
  maxPoints: 10,
};

export const PHYSICS_DUE: HomeworkSummary = {
  evaluationId: '7d2b5c10-a1b2-4c3d-9e4f-5a6b7c8d9e04',
  title: 'Devoir de Physique — la vitesse',
  subjectLabel: 'Physique',
  teacherLabel: 'M. Ilunga',
  dueDate: '2026-09-23',
  dueTime: '18:00',
  dueAt: '2026-09-23T17:00:00Z',
  deliveryMode: 'ONLINE',
  status: 'DUE',
  points: null,
  maxPoints: 20,
};

export const ENGLISH_DUE: HomeworkSummary = {
  evaluationId: '7d2b5c10-a1b2-4c3d-9e4f-5a6b7c8d9e05',
  title: 'Devoir d’Anglais — se présenter',
  subjectLabel: 'Anglais',
  teacherLabel: null,
  dueDate: '2026-09-23',
  dueTime: '08:00',
  dueAt: '2026-09-23T07:00:00Z',
  deliveryMode: 'IN_CLASS',
  status: 'DUE',
  points: null,
  maxPoints: 10,
};

export const GEOGRAPHY_DUE: HomeworkSummary = {
  evaluationId: '7d2b5c10-a1b2-4c3d-9e4f-5a6b7c8d9e06',
  title: 'Devoir de Géographie — carte du relief',
  subjectLabel: 'Géographie',
  teacherLabel: 'M. Lukusa',
  dueDate: '2026-09-29',
  dueTime: null,
  dueAt: '2026-09-29T22:59:59Z',
  deliveryMode: 'IN_CLASS',
  status: 'DUE',
  points: null,
  maxPoints: 20,
};

export const HOMEWORK: readonly HomeworkSummary[] = [
  MATHS_GRADED,
  FRENCH_MISSED,
  HISTORY_AWAITING,
  ENGLISH_DUE,
  PHYSICS_DUE,
  GEOGRAPHY_DUE,
];

export function homeworkListFixture(items: readonly HomeworkSummary[] = HOMEWORK): HomeworkList {
  return {
    from: '2026-09-01',
    to: '2026-10-20',
    today: '2026-09-22',
    schoolDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    items,
  };
}

const homeworkHref = (id: string, document: 'subject' | 'answer-key') =>
  `/api/v1/parent/children/${GRACE.childId}/homework/${id}/${document}`;

const DETAILS: Readonly<Record<string, Omit<HomeworkDetail, keyof HomeworkSummary>>> = {
  [MATHS_GRADED.evaluationId]: {
    assignedAt: '2026-09-07T09:00:00Z',
    lateSubmissionAllowed: false,
    programme: ['Addition et soustraction de fractions'],
    instructions: 'Rédiger sur une copie double.',
    questions: [
      { number: 1, statement: 'Calculez 3/4 + 1/6.', points: 5 },
      { number: 2, statement: 'Simplifiez 18/24.', points: 5 },
      { number: 3, statement: 'Résolvez le problème de la page 42.', points: 10 },
    ],
    result: {
      points: 15,
      maxPoints: 20,
      classAverage: 12.25,
      gradedAt: '2026-09-18T15:00:00Z',
      teacherComment: 'Bon travail. Attention au plus petit dénominateur commun.',
      absenceJustified: null,
    },
    documents: [
      {
        kind: 'ANSWER_KEY',
        fileName: 'CE-Mathematiques-2026-09-14.pdf',
        contentType: 'application/pdf',
        sizeBytes: 524_288,
        publishedAt: '2026-09-18T15:00:00Z',
        href: homeworkHref(MATHS_GRADED.evaluationId, 'answer-key'),
      },
      {
        kind: 'SUBJECT',
        fileName: 'SE-Mathematiques-2026-09-14.pdf',
        contentType: 'application/pdf',
        sizeBytes: 312_000,
        publishedAt: '2026-09-07T09:00:00Z',
        href: homeworkHref(MATHS_GRADED.evaluationId, 'subject'),
      },
    ],
    submission: null,
  },
  [FRENCH_MISSED.evaluationId]: {
    assignedAt: '2026-09-09T08:00:00Z',
    lateSubmissionAllowed: false,
    programme: [],
    instructions: null,
    questions: [{ number: 1, statement: 'Résumez le texte en dix lignes.', points: 20 }],
    result: null,
    documents: [],
    submission: null,
  },
  [HISTORY_AWAITING.evaluationId]: {
    assignedAt: '2026-09-14T08:00:00Z',
    lateSubmissionAllowed: false,
    programme: [],
    instructions: 'Format A3.',
    questions: [
      { number: 1, statement: 'Placez sur une frise les dates clés de 1885 à 1960.', points: 10 },
    ],
    result: null,
    documents: [],
    submission: null,
  },
  [PHYSICS_DUE.evaluationId]: {
    assignedAt: '2026-09-16T10:30:00Z',
    lateSubmissionAllowed: true,
    programme: ['Vitesse moyenne', 'Conversion km/h et m/s'],
    instructions: 'Calculatrice autorisée.',
    questions: [
      {
        number: 1,
        statement: 'Un bus parcourt 120 km en 2 h : quelle est sa vitesse moyenne ?',
        points: 8,
      },
      { number: 2, statement: 'Convertissez 72 km/h en m/s.', points: 12 },
    ],
    result: null,
    documents: [
      {
        kind: 'SUBJECT',
        fileName: 'SE-Physique-2026-09-23.pdf',
        contentType: 'application/pdf',
        sizeBytes: 845_000,
        publishedAt: '2026-09-16T10:30:00Z',
        href: homeworkHref(PHYSICS_DUE.evaluationId, 'subject'),
      },
    ],
    submission: null,
  },
  [ENGLISH_DUE.evaluationId]: {
    assignedAt: '2026-09-17T08:00:00Z',
    lateSubmissionAllowed: false,
    programme: [],
    instructions: null,
    questions: [{ number: 1, statement: 'Write five sentences about yourself.', points: null }],
    result: null,
    documents: [],
    submission: null,
  },
  [GEOGRAPHY_DUE.evaluationId]: {
    assignedAt: '2026-09-21T08:00:00Z',
    lateSubmissionAllowed: false,
    programme: [],
    instructions: null,
    questions: [],
    result: null,
    documents: [],
    submission: null,
  },
};

/** Fiche d'un devoir de la liste ; undefined pour un id inconnu (le serveur répond 404). */
export function homeworkDetailFixture(evaluationId: string): HomeworkDetail | undefined {
  const summary = HOMEWORK.find((item) => item.evaluationId === evaluationId);
  const detail = DETAILS[evaluationId];
  return summary && detail ? { ...summary, ...detail } : undefined;
}

/** Ce que décrit le serveur d'un fichier reçu : nom sur le téléphone, type lu, poids. */
export interface ReceivedFile {
  readonly name: string;
  readonly type: string;
  readonly size: number;
}

/**
 * Fiche relue après un dépôt réussi, comme la rend `POST …/submission` : statut `SUBMITTED`,
 * copie renseignée. undefined pour un id inconnu.
 */
export function submittedHomeworkFixture(
  evaluationId: string,
  files: readonly ReceivedFile[],
  submittedAt = '2026-09-22T20:05:00Z',
): HomeworkDetail | undefined {
  const detail = homeworkDetailFixture(evaluationId);
  if (!detail) return undefined;
  return {
    ...detail,
    status: 'SUBMITTED',
    submission: {
      submittedAt,
      late: false,
      files: files.map((file, index) => ({
        kind: 'SUBMISSION',
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        publishedAt: submittedAt,
        href: `/api/v1/parent/children/${GRACE.childId}/homework/${evaluationId}/submission/files/f${index + 1}`,
      })),
    },
  };
}
