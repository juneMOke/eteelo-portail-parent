import type { GradeQuery, ReportCard, ReportCardLine } from '../app/core/api/grades.contract';
import { GRACE } from './bootstrap.fixture';
import { COURSES } from './grade-courses.fixture';
import { TERM, selectionFixture } from './grades-terms.fixture';

/** Lignes du bulletin : les cours sans note gardent leur ligne, en fin de liste. */
const LINES: readonly ReportCardLine[] = [...COURSES]
  .sort((a, b) => Number(a.average === null) - Number(b.average === null))
  .map(({ courseId, subjectLabel, subjectCode, average }) => ({
    courseId,
    subjectLabel,
    subjectCode,
    percent: average?.percent ?? null,
    obtained: average?.obtained ?? null,
    max: average?.max ?? null,
    state: average?.state ?? null,
  }));

export const REPORT_CARD_ID = 'e1000000-0000-4000-8000-000000000001';
export const REPORT_CARD_PDF = `/api/v1/parent/children/${GRACE.childId}/grades/report-card/${REPORT_CARD_ID}/pdf`;

/** Sans paramètre, le serveur ouvre le dernier bulletin publié, sinon toute la période en cours. */
const DEFAULT = { periodId: TERM.first, part: 'ALL' } as const;

/**
 * Mon bulletin de Grâce, selon la sélection :
 * - tout le 1er trimestre, une fois publié (`published`) : officiel, avec rang et PDF scellé ;
 * - tout le 1er trimestre avant publication, ou sa 1re période : provisoire, sur 6 notes ;
 * - toute autre portion : provisoire et sans note.
 */
export function reportCardFixture(query: GradeQuery = {}, published = false): ReportCard {
  const selection = selectionFixture(query, DEFAULT);
  const firstTerm = selection.periodId === TERM.first;
  const base = {
    selection,
    publishedAt: null,
    rank: null,
    evolution: null,
    document: null,
  };
  if (published && firstTerm && selection.part === 'ALL') {
    return {
      ...base,
      status: 'OFFICIAL',
      scope: 'YEAR_TO_DATE',
      averageLabel: 'Moyenne de l’année au 1er trimestre',
      publishedAt: '2026-12-19T09:00:00Z',
      gradedCount: null,
      average: { percent: 58.4, state: 'AVERAGE' },
      rank: { position: 8, of: 32 },
      lines: LINES,
      document: { href: REPORT_CARD_PDF, number: 'BUL-2026-0042', sizeBytes: 245_760 },
    };
  }
  const provisional = {
    ...base,
    status: 'PROVISIONAL',
    scope: 'PERIOD',
    averageLabel: `Moyenne provisoire · ${selection.label}`,
  } as const;
  if (firstTerm && (selection.part === 'ALL' || selection.part === 'FIRST')) {
    return {
      ...provisional,
      gradedCount: 6,
      average: { percent: 52.9, state: 'AVERAGE' },
      lines: LINES,
    };
  }
  return {
    ...provisional,
    gradedCount: 0,
    average: null,
    lines: LINES.map((line) => ({
      ...line,
      percent: null,
      obtained: null,
      max: null,
      state: null,
    })),
  };
}
