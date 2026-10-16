import { HttpErrorResponse } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { settle } from '../../../../testing/async';
import { GRACE } from '../../../../testing/bootstrap.fixture';
import { gradeWeekFixture } from '../../../../testing/grades-week.fixture';
import { GradeWeek } from '../../../core/api/grades.contract';
import { ParentApi } from '../../../core/api/parent-api';
import GradesWeekPage from './grades-week.page';

registerLocaleData(localeFr);

describe('GradesWeekPage', () => {
  async function render(
    date?: string,
    gradesWeek: (childId: string, date?: string) => Observable<GradeWeek> = (_, day) =>
      of(gradeWeekFixture(day)),
  ) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'fr' },
        { provide: ParentApi, useValue: { gradesWeek } },
      ],
    });
    const fixture = TestBed.createComponent(GradesWeekPage);
    fixture.componentRef.setInput('childId', GRACE.childId);
    if (date) fixture.componentRef.setInput('date', date);
    await settle();
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('groupe les évaluations de la semaine par jour, sans moyenne', async () => {
    const { el } = await render('2026-09-16');
    const headings = [...el.querySelectorAll('.day-heading')].map((h) => h.textContent);

    expect(headings).toEqual([
      'Lundi 14/09',
      'Mardi 15/09',
      'Mercredi 16/09',
      'Jeudi 17/09',
      'Vendredi 18/09',
    ]);
    expect(el.querySelectorAll('app-result-card')).toHaveLength(7);
    expect(el.querySelectorAll('.day')[4].querySelectorAll('app-result-card')).toHaveLength(3);
    expect(el.textContent).not.toContain('%');
  });

  it('dit la semaine dans le bandeau bleu, et son résumé dessous', async () => {
    const { el } = await render('2026-09-16');

    expect(el.querySelector('ui-week-banner .title')?.textContent).toBe('14 – 19 sept.');
    expect(el.querySelector('ui-week-banner .relative')?.textContent).toBe('sem. passée');
    expect(el.querySelector('ui-week-banner .current')?.textContent?.trim()).toBe('Revenir');
    expect(el.querySelector('ui-week-banner .views')).toBeNull();
    expect(el.querySelector('.summary')?.textContent).toBe(
      '7 évaluations · 6 notées · 1 en attente',
    );
  });

  it('ouvre la fiche en gardant la semaine pour le retour', async () => {
    const { el } = await render('2026-09-16');
    const link = el.querySelector('app-result-card a');

    expect(link?.getAttribute('href')).toBe(
      `/c/${GRACE.childId}/homework/7d2b5c10-a1b2-4c3d-9e4f-5a6b7c8d9e01?from=grades-week&date=2026-09-14`,
    );
  });

  it('change de semaine par l’URL', async () => {
    const { el } = await render('2026-09-16');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    el.querySelector<HTMLButtonElement>('[aria-label="Semaine suivante"]')!.click();

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { date: '2026-09-21' },
        replaceUrl: true,
      }),
    );
  });

  it('mène d’une semaine vide à la dernière évaluation', async () => {
    const empty: GradeWeek = {
      ...gradeWeekFixture('2026-09-08'),
      lastEvaluationDate: '2026-09-18',
    };
    const { el } = await render('2026-09-08', () => of(empty));
    const link = el.querySelector<HTMLAnchorElement>('ui-empty-period a')!;

    expect(el.querySelector('ui-empty-period h2')?.textContent).toBe(
      'Aucune évaluation cette semaine',
    );
    expect(link.textContent).toBe('Dernière évaluation : vendredi 18/09');
    expect(link.getAttribute('href')).toBe('/?date=2026-09-18');
  });

  it('dit que les notes demandent une connexion quand l’appel échoue', async () => {
    const { el } = await render(undefined, () =>
      throwError(() => new HttpErrorResponse({ status: 0 })),
    );

    expect(el.querySelector('ui-load-error h2')?.textContent).toBe(
      'Impossible d’afficher les notes',
    );
    expect(el.textContent).toContain('Les notes nécessitent une connexion');
  });
});
