import { GRACE } from '../../../../testing/bootstrap.fixture';
import {
  REPEATED_LATENESS,
  TALKING,
  UNJUSTIFIED_ABSENCE,
} from '../../../../testing/discipline.fixture';
import {
  attendanceLink,
  caseParams,
  dayParams,
  disciplineLink,
  linkedAttendanceParams,
} from './conduct-links';

describe('conduct-links', () => {
  it('mène aux deux pages de l’enfant', () => {
    expect(attendanceLink(GRACE.childId)).toEqual(['/c', GRACE.childId, 'conduct', 'attendance']);
    expect(disciplineLink(GRACE.childId)).toEqual(['/c', GRACE.childId, 'conduct', 'discipline']);
  });

  it('ouvre le jour ou le mois lié à un fait', () => {
    expect(dayParams('2026-09-16')).toEqual({ month: '2026-09', date: '2026-09-16' });
    expect(linkedAttendanceParams(UNJUSTIFIED_ABSENCE)).toEqual({
      month: '2026-09',
      date: '2026-09-16',
    });
    expect(linkedAttendanceParams(REPEATED_LATENESS)).toEqual({ month: '2026-09' });
    expect(linkedAttendanceParams(TALKING)).toEqual({});
  });

  it('ouvre le fait sur son trimestre, ou sur le trimestre par défaut', () => {
    expect(caseParams({ id: 'c1', sanction: 'DETENTION', periodId: 't1' })).toEqual({
      term: 't1',
      case: 'c1',
    });
    expect(caseParams({ id: 'c1', sanction: 'DETENTION', periodId: null })).toEqual({ case: 'c1' });
  });
});
