import { HttpErrorResponse } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { settle } from '../../../../testing/async';
import { GRACE, bootstrapFixture } from '../../../../testing/bootstrap.fixture';
import { MATHS_GRADED, homeworkListFixture } from '../../../../testing/homework.fixture';
import { HomeworkList } from '../../../core/api/assignments.contract';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';
import HomeworkPage from './homework.page';

registerLocaleData(localeFr);

describe('HomeworkPage', () => {
  async function render(
    date?: string,
    homework: () => Observable<HomeworkList> = () => of(homeworkListFixture()),
  ) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'fr' },
        { provide: ParentApi, useValue: { bootstrap: () => of(bootstrapFixture()), homework } },
      ],
    });
    await TestBed.inject(SessionStore).ensureLoaded();
    const fixture = TestBed.createComponent(HomeworkPage);
    fixture.componentRef.setInput('childId', GRACE.childId);
    if (date) fixture.componentRef.setInput('date', date);
    await settle();
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const cardTitles = (el: HTMLElement) =>
    [...el.querySelectorAll('app-assignment-card .heading')].map((h) => h.textContent?.trim());
  const cardWhens = (el: HTMLElement) =>
    [...el.querySelectorAll('app-assignment-card .when')].map((w) => w.textContent?.trim());

  it("s'ouvre sur le prochain jour qui a un devoir à rendre", async () => {
    const { el } = await render();

    expect(el.querySelector('.date')?.textContent).toBe('mercredi 23 septembre 2026');
    expect(el.querySelector('.meta')?.textContent).toContain('2 devoirs');
    expect(cardTitles(el)).toEqual([
      'Devoir d’Anglais — se présenter.',
      'Devoir de Physique — la vitesse.',
    ]);
    expect(cardWhens(el)).toEqual([
      'Mercredi 23/09 · avant 08:00 · en classe.',
      'Mercredi 23/09 · avant 18:00 · en ligne.',
    ]);
  });

  it("n'écrit que la date quand l'enseignant n'a pas fixé d'heure", async () => {
    const { el } = await render('2026-09-29');

    expect(cardWhens(el)).toEqual(['Mardi 29/09 · en classe.']);
  });

  it('affiche un devoir corrigé avec sa note, et mène à sa fiche en gardant le jour', async () => {
    const { el } = await render('2026-09-14');
    const card = el.querySelector('app-assignment-card a');

    expect(card?.textContent).toContain('Corrigé');
    expect(card?.querySelector('ui-grade')?.textContent).toContain('15/20');
    expect(card?.getAttribute('href')).toBe(
      `/c/${GRACE.childId}/homework/${MATHS_GRADED.evaluationId}?date=2026-09-14`,
    );
  });

  it('dit un jour vide et mène au prochain devoir', async () => {
    const { el } = await render('2026-09-24');

    expect(el.querySelector('.empty-day h2')?.textContent).toBe('Aucun devoir à rendre ce jour');
    expect(el.querySelector('.next')?.textContent).toContain('Prochain devoir : mardi 29/09');
  });

  it("change de jour par l'URL, sans relancer d'appel", async () => {
    const homework = vi.fn(() => of(homeworkListFixture()));
    const { el, fixture } = await render(undefined, homework);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    el.querySelector<HTMLButtonElement>('[aria-label="Jour suivant"]')?.click();
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { date: '2026-09-24' }, replaceUrl: true }),
    );

    fixture.componentRef.setInput('date', '2026-09-24');
    await fixture.whenStable();
    expect(el.querySelector('.date')?.textContent).toBe('jeudi 24 septembre 2026');
    expect(homework).toHaveBeenCalledOnce();
  });

  it("propose de réessayer quand la liste n'a pas pu être chargée", async () => {
    let calls = 0;
    const { el, fixture } = await render(undefined, () =>
      calls++ === 0
        ? throwError(() => new HttpErrorResponse({ status: 0 }))
        : of(homeworkListFixture()),
    );

    expect(el.querySelector('ui-empty-state h2')?.textContent).toBe(
      'Impossible d’afficher les devoirs',
    );
    el.querySelector<HTMLButtonElement>('ui-empty-state button')?.click();
    await settle();
    await fixture.whenStable();
    expect(el.querySelectorAll('app-assignment-card')).toHaveLength(2);
  });
});
