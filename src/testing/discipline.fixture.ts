import type {
  ChildDiscipline,
  DisciplineCase,
  DisciplinePeriod,
} from '../app/core/api/conduct.contract';
import { CASE_ID } from './attendance.fixture';
import { GRADE_PERIODS, TERM } from './grades-terms.fixture';

/** Les faits consignés de Grâce au 1er trimestre ; les autres trimestres n'en ont aucun. */
export const DISCIPLINE_PERIODS: readonly DisciplinePeriod[] = GRADE_PERIODS.map((period) => ({
  id: period.periodId,
  label: period.label,
  startDate: period.startDate,
  endDate: period.endDate,
  current: period.current,
}));

function disciplineCase(
  changes: Partial<DisciplineCase> & Pick<DisciplineCase, 'id'>,
): DisciplineCase {
  return {
    date: '2026-09-11',
    title: 'Bavardage en cours de chimie',
    category: 'TALKING_IN_CLASS',
    severity: 'MINOR',
    sanction: null,
    description: 'A bavardé pendant la correction de l’interrogation, malgré deux rappels.',
    recordedBy: 'Paul Kalala',
    recordedAt: '2026-09-11T10:15:00Z',
    revisedAt: null,
    parentRequest: null,
    linkedAttendance: null,
    ...changes,
  };
}

export const REPEATED_LATENESS = disciplineCase({
  id: CASE_ID.lateness,
  date: '2026-09-22',
  title: 'Retards répétés',
  category: 'REPEATED_LATENESS',
  sanction: 'PARENTS_SUMMONED',
  description: 'Trois retards en septembre, dont deux le lundi.',
  parentRequest: 'MEETING',
  linkedAttendance: { kind: 'MONTH', date: '2026-09-01' },
});

export const UNJUSTIFIED_ABSENCE = disciplineCase({
  id: CASE_ID.absence,
  date: '2026-09-16',
  title: 'Absence non justifiée',
  category: 'UNJUSTIFIED_ABSENCE',
  severity: 'MAJOR',
  sanction: 'WRITTEN_WARNING',
  description: 'Absence de toute la journée, sans nouvelle de la famille.',
  revisedAt: '2026-09-22T08:00:00Z',
  linkedAttendance: { kind: 'DAY', date: '2026-09-16' },
});

export const TALKING = disciplineCase({ id: CASE_ID.talking });

export function disciplineFixture(periodId: string = TERM.first): ChildDiscipline {
  const period =
    DISCIPLINE_PERIODS.find((candidate) => candidate.id === periodId) ?? DISCIPLINE_PERIODS[0];
  const { id, label, startDate, endDate } = period;
  const cases = period.id === TERM.first ? [REPEATED_LATENESS, UNJUSTIFIED_ABSENCE, TALKING] : [];
  return {
    period: { id, label, startDate, endDate },
    periods: DISCIPLINE_PERIODS,
    summary: {
      minor: cases.filter((item) => item.severity === 'MINOR').length,
      major: cases.filter((item) => item.severity === 'MAJOR').length,
      serious: cases.filter((item) => item.severity === 'SERIOUS').length,
    },
    cases,
  };
}
