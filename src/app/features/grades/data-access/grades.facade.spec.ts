import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { settle } from '../../../../testing/async';
import { GRACE } from '../../../../testing/bootstrap.fixture';
import { gradeCoursesFixture } from '../../../../testing/grade-courses.fixture';
import { TERM } from '../../../../testing/grades-terms.fixture';
import { gradeWeekFixture } from '../../../../testing/grades-week.fixture';
import { reportCardFixture } from '../../../../testing/report-card.fixture';
import { TermQuery } from '../../../core/api/grades.contract';
import { ParentApi } from '../../../core/api/parent-api';
import { GradesFacade } from './grades.facade';

describe('GradesFacade', () => {
  function setup() {
    const api = {
      gradesWeek: vi.fn((_: string, date?: string) => of(gradeWeekFixture(date))),
      gradeCourses: vi.fn((_: string, query: TermQuery) => of(gradeCoursesFixture(query))),
      reportCard: vi.fn((_: string, query: TermQuery) => of(reportCardFixture(query))),
    };
    TestBed.configureTestingModule({ providers: [{ provide: ParentApi, useValue: api }] });
    const facade = TestBed.inject(GradesFacade);
    const inContext = <T>(create: () => T) =>
      runInInjectionContext(TestBed.inject(Injector), create);
    return { facade, api, inContext };
  }

  it('relit la semaine quand la date change', async () => {
    const { facade, api, inContext } = setup();
    const date = signal<string | undefined>(undefined);
    const week = inContext(() =>
      facade.weekResource(() => ({ childId: GRACE.childId, date: date() })),
    );

    await settle();
    expect(week.value()?.from).toBe('2026-09-21');
    date.set('2026-09-16');
    await settle();

    expect(week.value()?.items).toHaveLength(7);
    expect(api.gradesWeek).toHaveBeenLastCalledWith(GRACE.childId, '2026-09-16');
  });

  it('demande les cours et le bulletin pour la sélection donnée', async () => {
    const { facade, api, inContext } = setup();
    const query = { termId: TERM.first };
    const courses = inContext(() =>
      facade.coursesResource(() => ({ childId: GRACE.childId, query })),
    );
    const report = inContext(() =>
      facade.reportCardResource(() => ({ childId: GRACE.childId, query })),
    );

    await settle();

    expect(api.gradeCourses).toHaveBeenCalledWith(GRACE.childId, query);
    expect(courses.value()?.selection.label).toBe('1er trimestre');
    expect(report.value()?.status).toBe('OFFICIAL');
  });

  it('mène au PDF scellé par la route du bulletin', () => {
    const { facade } = setup();

    expect(facade.documentUrl('c1', 'r1')).toBe(
      '/api/v1/parent/children/c1/report-cards/r1/document',
    );
  });
});
