import { CHEMISTRY_PASSED, MATHS_HOMEWORK_PASSED } from '../../../../testing/grades-week.fixture';
import { evaluationLink, evaluationQueryParams, gradesLink } from './grade-links';

describe('grade-links', () => {
  it('ouvre une épreuve dans Mes évaluations et un devoir dans Mes devoirs', () => {
    expect(evaluationLink('c1', CHEMISTRY_PASSED)).toEqual([
      '/c',
      'c1',
      'assessments',
      CHEMISTRY_PASSED.evaluationId,
    ]);
    expect(evaluationLink('c1', MATHS_HOMEWORK_PASSED)).toEqual([
      '/c',
      'c1',
      'homework',
      MATHS_HOMEWORK_PASSED.evaluationId,
    ]);
  });

  it('dit à la fiche où revenir, et dans quel état', () => {
    expect(evaluationQueryParams('grades-week', { date: '2026-09-14' })).toEqual({
      from: 'grades-week',
      date: '2026-09-14',
    });
  });

  it('mène aux pages de Mes notes', () => {
    expect(gradesLink('c1', 'courses')).toEqual(['/c', 'c1', 'grades', 'courses']);
  });
});
