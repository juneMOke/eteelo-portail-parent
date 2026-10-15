import type {
  GradePart,
  GradePeriod,
  GradeQuery,
  GradeSelection,
} from '../app/core/api/grades.contract';

/**
 * Périodes scolaires de Grâce (contrat Mes notes) : le 1er trimestre est en cours, dans sa
 * 1re période. Partagées par Mes cours et Mon bulletin.
 */
export const TERM = {
  first: 'a1000000-0000-4000-8000-000000000001',
  second: 'a1000000-0000-4000-8000-000000000002',
  third: 'a1000000-0000-4000-8000-000000000003',
} as const;

function term(
  periodId: string,
  order: number,
  startDate: string,
  endDate: string,
  current = false,
): GradePeriod {
  return {
    periodId,
    label: order === 1 ? '1er trimestre' : `${order}e trimestre`,
    order,
    status: 'OPEN',
    startDate,
    endDate,
    current,
    parts: [
      { part: 'FIRST', label: '1re période', status: 'OPEN', startDate, endDate, current },
      { part: 'SECOND', label: '2e période', status: 'OPEN', startDate, endDate, current: false },
      {
        part: 'EXAM',
        label: 'Examen',
        status: 'OPEN',
        startDate: null,
        endDate: null,
        current: false,
      },
    ],
  };
}

export const GRADE_PERIODS: readonly GradePeriod[] = [
  term(TERM.first, 1, '2026-09-07', '2026-12-18', true),
  term(TERM.second, 2, '2027-01-04', '2027-03-26'),
  term(TERM.third, 3, '2027-04-12', '2027-07-02'),
];

const PART_LABELS: Readonly<Record<string, string>> = {
  FIRST: '1re période',
  SECOND: '2e période',
  EXAM: 'Examen',
};

/**
 * Portion retenue par le serveur pour une requête : une période sans portion vaut toute la
 * période ; sans requête, le défaut de la page.
 */
export function selectionFixture(
  query: GradeQuery,
  fallback: { readonly periodId: string; readonly part: GradePart },
): GradeSelection {
  const periodId = query.periodId ?? fallback.periodId;
  const part = query.periodId ? (query.part ?? 'ALL') : fallback.part;
  const period = GRADE_PERIODS.find((candidate) => candidate.periodId === periodId);
  const label = period?.label ?? '';
  return { periodId, part, label: part === 'ALL' ? label : `${label} · ${PART_LABELS[part]}` };
}
