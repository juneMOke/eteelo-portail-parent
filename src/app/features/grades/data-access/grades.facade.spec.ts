import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { settle } from '../../../../testing/async';
import { GRACE } from '../../../../testing/bootstrap.fixture';
import { gradeCoursesFixture } from '../../../../testing/grade-courses.fixture';
import { GRADE_PERIODS, TERM } from '../../../../testing/grades-terms.fixture';
import { gradeWeekFixture } from '../../../../testing/grades-week.fixture';
import { reportCardFixture } from '../../../../testing/report-card.fixture';
import { GradeQuery } from '../../../core/api/grades.contract';
import { ParentApi } from '../../../core/api/parent-api';
import { GradesFacade } from './grades.facade';

describe('GradesFacade', () => {
  function setup() {
    const api = {
      gradesWeek: vi.fn((_: string, weekOf?: string) => of(gradeWeekFixture(weekOf))),
      gradePeriods: vi.fn(() => of([...GRADE_PERIODS])),
      gradeCourses: vi.fn((_: string, query: GradeQuery) => of(gradeCoursesFixture(query))),
      reportCard: vi.fn((_: string, query: GradeQuery) => of(reportCardFixture(query))),
    };
    TestBed.configureTestingModule({ providers: [{ provide: ParentApi, useValue: api }] });
    const facade = TestBed.inject(GradesFacade);
    const inContext = <T>(create: () => T) =>
      runInInjectionContext(TestBed.inject(Injector), create);
    return { facade, api, inContext };
  }

  it('relit la semaine quand le jour demandé change', async () => {
    const { facade, api, inContext } = setup();
    const weekOf = signal<string | undefined>(undefined);
    const week = inContext(() =>
      facade.weekResource(() => ({ childId: GRACE.childId, weekOf: weekOf() })),
    );

    await settle();
    expect(week.value()?.weekStart).toBe('2026-09-21');
    weekOf.set('2026-09-16');
    await settle();

    expect(week.value()?.days).toHaveLength(5);
    expect(api.gradesWeek).toHaveBeenLastCalledWith(GRACE.childId, '2026-09-16');
  });

  it('lit les périodes scolaires de l’enfant', async () => {
    const { facade, api, inContext } = setup();
    const periods = inContext(() => facade.periodsResource(() => GRACE.childId));

    await settle();

    expect(api.gradePeriods).toHaveBeenCalledWith(GRACE.childId);
    expect(periods.value()?.map((period) => period.label)).toEqual([
      '1er trimestre',
      '2e trimestre',
      '3e trimestre',
    ]);
  });

  it('demande les cours et le bulletin pour la sélection donnée', async () => {
    const { facade, api, inContext } = setup();
    const query = { periodId: TERM.first, part: 'FIRST' };
    const courses = inContext(() =>
      facade.coursesResource(() => ({ childId: GRACE.childId, query })),
    );
    const report = inContext(() =>
      facade.reportCardResource(() => ({ childId: GRACE.childId, query })),
    );

    await settle();

    expect(api.gradeCourses).toHaveBeenCalledWith(GRACE.childId, query);
    expect(api.reportCard).toHaveBeenCalledWith(GRACE.childId, query);
    expect(courses.value()?.selection?.label).toBe('1er trimestre · 1re période');
    expect(report.value()?.status).toBe('PROVISIONAL');
  });
});
