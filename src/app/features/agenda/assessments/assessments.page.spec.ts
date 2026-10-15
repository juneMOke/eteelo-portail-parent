import { HttpErrorResponse } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { evaluationListFixture } from '../../../../testing/assessments.fixture';
import { settle } from '../../../../testing/async';
import { GRACE, bootstrapFixture } from '../../../../testing/bootstrap.fixture';
import { EvaluationList } from '../../../core/api/assignments.contract';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';
import AssessmentsPage from './assessments.page';

registerLocaleData(localeFr);

describe('AssessmentsPage', () => {
  async function render(
    date?: string,
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
    if (date) fixture.componentRef.setInput('date', date);
    await settle();
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const cardTitles = (el: HTMLElement) =>
    [...el.querySelectorAll('app-assignment-card .heading')].map((h) => h.textContent?.trim());

  it("s'ouvre sur le prochain jour qui a une épreuve à venir", async () => {
    const { el } = await render();

    expect(el.querySelector('.date')?.textContent).toBe('jeudi 24 septembre 2026');
    expect(el.querySelector('.meta')?.textContent).toContain('dans 2 jours');
    expect(el.querySelector('.meta')?.textContent).toContain('2 épreuves');
    expect(cardTitles(el)).toEqual([
      'Interrogation de Chimie — les bases.',
      'Examen d’Histoire — la période coloniale.',
    ]);
  });

  it('affiche une épreuve corrigée avec sa note, et mène à sa fiche en gardant le jour', async () => {
    const { el } = await render('2026-09-15');
    const card = el.querySelector('app-assignment-card a');

    expect(card?.textContent).toContain('Corrigé');
    expect(card?.querySelector('ui-grade')?.textContent).toContain('13,5/20');
    expect(card?.getAttribute('href')).toBe(
      `/c/${GRACE.childId}/assessments/41e0a1b2-c3d4-4e5f-8a6b-7c8d9e0f1a01?date=2026-09-15`,
    );
  });

  it('dit un jour vide et mène au prochain jour occupé', async () => {
    const { el } = await render('2026-09-22');

    expect(el.querySelector('.empty-day h2')?.textContent).toBe('Aucune épreuve ce jour');
    expect(el.querySelector('.next')?.textContent).toContain('Prochaine épreuve : jeudi 24/09');
  });

  it("distingue un jour sans école d'un jour sans épreuve", async () => {
    const { el } = await render('2026-09-26');

    expect(el.querySelector('.empty-day h2')?.textContent).toBe('Pas d’école ce jour');
    expect(el.querySelector('.meta')?.textContent).toContain('Pas d’école');
  });

  it("change de jour par l'URL, sans relancer d'appel", async () => {
    const evaluations = vi.fn(() => of(evaluationListFixture()));
    const { el, fixture } = await render(undefined, evaluations);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    el.querySelector<HTMLButtonElement>('[aria-label="Jour suivant"]')?.click();
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { date: '2026-09-25' }, replaceUrl: true }),
    );

    fixture.componentRef.setInput('date', '2026-09-25');
    await fixture.whenStable();
    expect(el.querySelector('.date')?.textContent).toBe('vendredi 25 septembre 2026');
    expect(evaluations).toHaveBeenCalledOnce();
  });

  it("propose de réessayer quand la liste n'a pas pu être chargée", async () => {
    let calls = 0;
    const { el, fixture } = await render(undefined, () =>
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
    expect(el.querySelectorAll('app-assignment-card')).toHaveLength(2);
  });
});
