import { HttpErrorResponse } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { GEOGRAPHY_LOW, evaluationListFixture } from '../../../../testing/assessments.fixture';
import { settle } from '../../../../testing/async';
import { GRACE, bootstrapFixture } from '../../../../testing/bootstrap.fixture';
import { EvaluationList } from '../../../core/api/assignments.contract';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';
import AssessmentsPage from './assessments.page';

registerLocaleData(localeFr);

describe('AssessmentsPage', () => {
  async function render(
    params: Record<string, string> = {},
    evaluations: () => Observable<EvaluationList> = () => of(evaluationListFixture()),
  ) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'fr' },
        { provide: ParentApi, useValue: { bootstrap: () => of(bootstrapFixture()), evaluations } },
      ],
    });
    await TestBed.inject(SessionStore).ensureLoaded();
    const fixture = TestBed.createComponent(AssessmentsPage);
    fixture.componentRef.setInput('childId', GRACE.childId);
    for (const [name, value] of Object.entries(params)) fixture.componentRef.setInput(name, value);
    await settle();
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const texts = (el: HTMLElement, selector: string) =>
    [...el.querySelectorAll(selector)].map((node) => node.textContent?.replace(/\s+/g, ' ').trim());

  it('s’ouvre sur la semaine en cours, avec la date et la durée de chaque épreuve', async () => {
    const { el } = await render();

    expect(texts(el, '.day-head')).toEqual(['Lundi 21/09 · hier', 'Jeudi 24/09']);
    expect(texts(el, 'ui-assignment-card .when')).toEqual([
      'Lundi 21/09 · 50 min.',
      'Jeudi 24/09 · 45 min.',
      'Jeudi 24/09 · 2 h.',
    ]);
    expect(el.querySelector('ui-assignment-card .urgent')).toBeNull();
  });

  it('signale une épreuve de demain', async () => {
    const { el } = await render({}, () => of({ ...evaluationListFixture(), today: '2026-09-23' }));

    expect(texts(el, 'ui-assignment-card .urgent')).toEqual(['Épreuve demain.', 'Épreuve demain.']);
  });

  it('filtre les absences et donne leurs options propres', async () => {
    const { el } = await render({ week: '2026-09-14', status: 'ABSENT' });

    expect(texts(el, 'ui-assignment-card .heading')).toEqual(['Examen de Français — rédaction.']);
    expect(texts(el, 'ui-assignment-card .status')).toEqual(['Absent à l’épreuve.']);
    expect(el.querySelectorAll('ui-filter-menu .trigger')[1].textContent).toContain('Absences');
  });

  it('remplace le chevron par la note, à la couleur de son niveau', async () => {
    const { el } = await render({ week: '2026-09-14', status: 'GRADED' });
    const low = [...el.querySelectorAll('ui-assignment-card a')].find((card) =>
      card.getAttribute('href')?.includes(GEOGRAPHY_LOW.evaluationId),
    );

    expect(low?.querySelector('ui-grade')?.textContent).toContain('9/20');
    expect(low?.querySelector('.chevron')).toBeNull();
  });

  it('dit une semaine sans évaluation', async () => {
    const { el } = await render({}, () => of(evaluationListFixture([])));

    expect(el.querySelector('ui-empty-period h2')?.textContent).toBe(
      'Aucune évaluation cette semaine',
    );
    expect(el.querySelector('ui-empty-period p')?.textContent).toBe(
      'Utilisez les flèches pour changer de semaine.',
    );
  });

  it('dit un jour sans épreuve quand seul le filtre jour est posé', async () => {
    const { el } = await render({ day: '2026-09-22' });

    expect(el.querySelector('ui-empty-period h2')?.textContent).toBe('Aucune épreuve ce jour');
    expect(el.querySelector('ui-empty-period p')?.textContent).toBe(
      'Choisissez « Toute la semaine » pour tout revoir.',
    );
  });

  it("propose de réessayer quand la liste n'a pas pu être chargée", async () => {
    let calls = 0;
    const { el, fixture } = await render({}, () =>
      calls++ === 0
        ? throwError(() => new HttpErrorResponse({ status: 0 }))
        : of(evaluationListFixture()),
    );

    expect(el.querySelector('ui-empty-state h2')?.textContent).toBe(
      'Impossible d’afficher les évaluations',
    );
    el.querySelector<HTMLButtonElement>('ui-empty-state button')?.click();
    await settle();
    await fixture.whenStable();
    expect(el.querySelectorAll('ui-assignment-card')).toHaveLength(3);
  });
});
