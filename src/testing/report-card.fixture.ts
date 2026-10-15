import type { ReportCard, ReportCardLine, TermQuery } from '../app/core/api/grades.contract';
import { COURSES } from './grade-courses.fixture';
import { PERIOD, TERM, termTreeFixture } from './grades-terms.fixture';

const LINES: readonly ReportCardLine[] = COURSES.map(
  ({ courseId, label, teacherLabel, average }) => ({ courseId, label, teacherLabel, average }),
);

export const REPORT_CARD_ID = 'e1000000-0000-4000-8000-000000000001';

const DEFAULT = { termId: TERM.first, periodId: PERIOD.first } as const;

/**
 * Mon bulletin de Grâce, selon la sélection :
 * - par défaut (1re période) : provisoire, calculé sur 6 notes, sans rang ;
 * - tout le 1er trimestre : officiel, publié, avec rang et PDF scellé ;
 * - toute autre période : provisoire et sans note.
 */
export function reportCardFixture(query: TermQuery = {}): ReportCard {
  const tree = termTreeFixture(query, DEFAULT);
  const base = {
    ...tree,
    publishedAt: null,
    updatedAt: null,
    rank: null,
    evolution: null,
    document: null,
  };
  if (tree.selection.periodId === null) {
    return {
      ...base,
      status: 'OFFICIAL',
      scopeLabel: 'Moyenne de l’année au 1er trimestre',
      publishedAt: '2026-12-19T09:00:00Z',
      gradedCount: null,
      average: { percent: 58.4, obtained: 584, max: 1000 },
      rank: { position: 8, classSize: 32 },
      lines: LINES,
      document: {
        reportCardId: REPORT_CARD_ID,
        fileName: 'Bulletin-T1-Grace-Mukendi.pdf',
        sizeBytes: 245_760,
        signedBy: 'la direction',
      },
    };
  }
  if (tree.selection.periodId === PERIOD.first) {
    return {
      ...base,
      status: 'PROVISIONAL',
      scopeLabel: tree.selection.label,
      gradedCount: 6,
      average: { percent: 52.9, obtained: 48.5, max: 91.7 },
      lines: LINES,
    };
  }
  return {
    ...base,
    status: 'PROVISIONAL',
    scopeLabel: tree.selection.label,
    gradedCount: 0,
    average: null,
    lines: LINES.map((line) => ({ ...line, average: null })),
  };
}
