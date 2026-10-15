import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { settle } from '../../../../testing/async';
import { GRACE } from '../../../../testing/bootstrap.fixture';
import { gradeCoursesFixture } from '../../../../testing/grade-courses.fixture';
import { PERIOD, TERM } from '../../../../testing/grades-terms.fixture';
import { COURSE } from '../../../../testing/grades-week.fixture';
import { TermQuery } from '../../../core/api/grades.contract';
import { ParentApi } from '../../../core/api/parent-api';
import { TermSelectionMemory } from '../data-access/term-selection';
import CoursesPage from './courses.page';

registerLocaleData(localeFr);

describe('CoursesPage', () => {
  async function render(
    inputs: { term?: string; period?: string; course?: string } = {},
    before: () => void = () => undefined,
  ) {
    const gradeCourses = vi.fn((_: string, query: TermQuery) => of(gradeCoursesFixture(query)));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'fr' },
        { provide: ParentApi, useValue: { gradeCourses } },
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
    const { el } = await render({ term: TERM.first, period: PERIOD.first, course: COURSE.maths });
    const maths = rows(el)[0];

    expect(maths.querySelector('.header')?.getAttribute('aria-expanded')).toBe('true');
    expect(maths.querySelectorAll('app-result-card')).toHaveLength(2);
    expect(maths.querySelector('app-result-card .context')?.textContent).toBe(
      'Lundi 21/09 · Fractions, Simplification',
    );
    expect(maths.querySelector('app-result-card a')?.getAttribute('href')).toContain(
      `?from=courses&term=${TERM.first}&period=${PERIOD.first}&course=${COURSE.maths}`,
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
    const { el } = await render({ term: TERM.first, period: PERIOD.second });

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
      expect.objectContaining({ queryParams: { term: TERM.first, period: null, course: null } }),
    );
    expect(TestBed.inject(TermSelectionMemory).recall(GRACE.childId)).toEqual({
      termId: TERM.first,
    });
  });

  it('reprend la sélection de la session quand l’URL n’en porte pas', async () => {
    const { gradeCourses } = await render({}, () =>
      TestBed.inject(TermSelectionMemory).remember(GRACE.childId, {
        termId: TERM.first,
        periodId: PERIOD.second,
      }),
    );

    expect(gradeCourses).toHaveBeenCalledWith(GRACE.childId, {
      termId: TERM.first,
      periodId: PERIOD.second,
    });
  });

  it('mène à Mon bulletin de la même période', async () => {
    const { el } = await render();

    expect(el.querySelector('a.sibling')?.getAttribute('href')).toBe(
      `/c/${GRACE.childId}/grades/report-card?term=${TERM.first}&period=${PERIOD.first}`,
    );
  });
});
