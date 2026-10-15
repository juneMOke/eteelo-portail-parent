import type { Term, TermQuery, TermTree } from '../app/core/api/grades.contract';

/**
 * Trimestres de Grâce (contrat Mes notes) : seul le 1er est ouvert ; son examen ouvre le
 * 7 décembre. Partagés par Mes cours et Mon bulletin.
 */
export const TERM = {
  first: 'a1000000-0000-4000-8000-000000000001',
  second: 'a1000000-0000-4000-8000-000000000002',
  third: 'a1000000-0000-4000-8000-000000000003',
} as const;

export const PERIOD = {
  first: 'b1000000-0000-4000-8000-000000000001',
  second: 'b1000000-0000-4000-8000-000000000002',
  exam: 'b1000000-0000-4000-8000-000000000003',
} as const;

export const TERMS: readonly Term[] = [
  {
    termId: TERM.first,
    label: '1er trimestre',
    opensOn: '2026-09-07',
    available: true,
    periods: [
      {
        periodId: PERIOD.first,
        label: '1re période',
        kind: 'PERIOD',
        opensOn: '2026-09-07',
        available: true,
      },
      {
        periodId: PERIOD.second,
        label: '2e période',
        kind: 'PERIOD',
        opensOn: '2026-10-19',
        available: true,
      },
      {
        periodId: PERIOD.exam,
        label: 'Examen',
        kind: 'EXAM',
        opensOn: '2026-12-07',
        available: false,
      },
    ],
  },
  {
    termId: TERM.second,
    label: '2e trimestre',
    opensOn: '2027-01-04',
    available: false,
    periods: [],
  },
  {
    termId: TERM.third,
    label: '3e trimestre',
    opensOn: '2027-04-12',
    available: false,
    periods: [],
  },
];

const PERIOD_LABELS: Readonly<Record<string, string>> = {
  [PERIOD.first]: '1re période',
  [PERIOD.second]: '2e période',
  [PERIOD.exam]: 'Examen',
};

/** Arbre et sélection rendus pour une requête ; sans requête, la sélection par défaut. */
export function termTreeFixture(query: TermQuery, fallback: Required<TermQuery>): TermTree {
  const termId = query.termId ?? fallback.termId;
  const periodId = query.termId ? (query.periodId ?? null) : fallback.periodId;
  const term = TERMS.find((candidate) => candidate.termId === termId) ?? TERMS[0];
  const label = periodId ? `${term.label} · ${PERIOD_LABELS[periodId]}` : term.label;
  return { terms: TERMS, selection: { termId: term.termId, periodId, label } };
}
