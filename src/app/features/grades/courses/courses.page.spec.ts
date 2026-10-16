import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { settle } from '../../../../testing/async';
import { GRACE } from '../../../../testing/bootstrap.fixture';
import { gradeCoursesFixture } from '../../../../testing/grade-courses.fixture';
import { GRADE_PERIODS, TERM } from '../../../../testing/grades-terms.fixture';
import { COURSE } from '../../../../testing/grades-week.fixture';
import { GradeQuery } from '../../../core/api/grades.contract';
import { ParentApi } from '../../../core/api/parent-api';
import { TermMemory } from '../../../core/navigation/term-memory';
import CoursesPage from './courses.page';

registerLocaleData(localeFr);

describe('CoursesPage', () => {
  async function render(
    inputs: { term?: string; part?: string; course?: string } = {},
    before: () => void = () => undefined,
  ) {
    const gradeCourses = vi.fn((_: string, query: GradeQuery) => of(gradeCoursesFixture(query)));
    const gradePeriods = () => of([...GRADE_PERIODS]);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'fr' },
        { provide: ParentApi, useValue: { gradeCourses, gradePeriods } },
      ],
    });
    Element.prototype.scrollIntoView ??= () => undefined;
    before();
    const fixture = TestBed.createComponent(CoursesPage);
    fixture.componentRef.setInput('childId', GRACE.childId);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    await settle();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, gradeCourses };
  }

  const rows = (el: HTMLElement) => [...el.querySelectorAll('app-course-row')];

  it('liste les cours dans l’ordre du bulletin, tout replié, cours sans note compris', async () => {
    const { el } = await render();

    expect(rows(el).map((row) => row.querySelector('.label')?.textContent)).toEqual([
      'Mathématiques',
      'Français',
      'Chimie',
      'Géographie',
      'Anglais',
      'Histoire',
      'Physique',
      'Éducation civique',
    ]);
    expect(el.querySelectorAll('[aria-expanded="true"]')).toHaveLength(0);
    expect(el.textContent).not.toContain('Rang');
  });

  it('déplie le cours ciblé, et ses évaluations ramènent à lui', async () => {
    const { el } = await render({ term: TERM.first, part: 'FIRST', course: COURSE.maths });
    const maths = rows(el)[0];

    expect(maths.querySelector('.header')?.getAttribute('aria-expanded')).toBe('true');
    expect(maths.querySelectorAll('app-result-card')).toHaveLength(2);
    expect(maths.querySelector('app-result-card .context')?.textContent).toBe(
      'Lundi 21/09 · Fractions, Simplification',
    );
    expect(maths.querySelector('app-result-card a')?.getAttribute('href')).toContain(
      `?from=courses&term=${TERM.first}&part=FIRST&course=${COURSE.maths}`,
    );
  });

  it('déplie et replie un cours au toucher', async () => {
    const { fixture, el } = await render();
    const header = rows(el)[2].querySelector<HTMLButtonElement>('.header')!;

    header.click();
    await fixture.whenStable();
    expect(header.getAttribute('aria-expanded')).toBe('true');
    header.click();
    await fixture.whenStable();
    expect(header.getAttribute('aria-expanded')).toBe('false');
  });

  it('dit qu’une période n’est pas encore cotée, sans reproche', async () => {
    const { el } = await render({ term: TERM.first, part: 'SECOND' });

    expect(el.querySelector('ui-empty-period h2')?.textContent).toBe(
      'Aucune évaluation pour la 2e période du 1er trimestre.',
    );
    expect(rows(el)).toHaveLength(0);
  });

  it('retient la sélection choisie et l’inscrit dans l’URL', async () => {
    const { el } = await render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const inline = el.querySelector('app-term-picker .inline')!;

    inline
      .querySelectorAll<HTMLButtonElement>('[role="radiogroup"]')[1]
      .querySelectorAll<HTMLButtonElement>('[role="radio"]')[0]
      .click();

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { term: TERM.first, part: 'ALL', course: null } }),
    );
    expect(TestBed.inject(TermMemory).recall(GRACE.childId)).toEqual({
      periodId: TERM.first,
      part: 'ALL',
    });
  });

  it('reprend la sélection de la session quand l’URL n’en porte pas', async () => {
    const { gradeCourses } = await render({}, () =>
      TestBed.inject(TermMemory).remember(GRACE.childId, {
        periodId: TERM.first,
        part: 'SECOND',
      }),
    );

    expect(gradeCourses).toHaveBeenCalledWith(GRACE.childId, {
      periodId: TERM.first,
      part: 'SECOND',
    });
  });

  it('mène à Mon bulletin de la même période', async () => {
    const { el } = await render();

    expect(el.querySelector('a.sibling')?.getAttribute('href')).toBe(
      `/c/${GRACE.childId}/grades/report-card?term=${TERM.first}&part=FIRST`,
    );
  });
});
