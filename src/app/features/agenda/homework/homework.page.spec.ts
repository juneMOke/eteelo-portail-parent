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

/** Grand écran simulé : `mediaQuery` lit `matchMedia`, absent du rendu de test. */
function wideScreen(): void {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

describe('HomeworkPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  async function render(
    params: Record<string, string> = {},
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
    for (const [name, value] of Object.entries(params)) fixture.componentRef.setInput(name, value);
    await settle();
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const texts = (el: HTMLElement, selector: string) =>
    [...el.querySelectorAll(selector)].map((node) => node.textContent?.replace(/\s+/g, ' ').trim());

  it('s’ouvre sur la semaine en cours, un jour par carte, les jours vides omis', async () => {
    const { el } = await render();

    expect(el.querySelector('app-week-banner .title')?.textContent).toBe('21 – 25 sept.');
    expect(el.querySelector('app-week-banner .relative')?.textContent).toBe('cette sem.');
    expect(texts(el, '.day-head')).toEqual(['Lundi 21/09 · hier', 'Mercredi 23/09 · demain']);
    expect(texts(el, 'app-assignment-card .heading')).toEqual([
      'Devoir d’Histoire — frise chronologique.',
      'Devoir d’Anglais — se présenter.',
      'Devoir de Physique — la vitesse.',
    ]);
    expect(texts(el, 'app-assignment-card .when')).toEqual([
      'Lundi 21/09.',
      'Mercredi 23/09 avant 8 h.',
      'Mercredi 23/09 avant 18 h.',
    ]);
  });

  it('signale en rouge un devoir à rendre demain, avec son heure limite', async () => {
    const { el } = await render();

    expect(texts(el, 'app-assignment-card .urgent')).toEqual([
      'À rendre demain avant 8 h.',
      'À rendre demain avant 18 h.',
    ]);
  });

  it('compte chaque option, l’autre filtre restant tel quel', async () => {
    const { el } = await render({ day: '2026-09-23' });
    const [day, status] = [...el.querySelectorAll<HTMLElement>('app-filter-menu .trigger')];

    expect(day.textContent).toContain('Mercredi 23');
    status.click();
    await TestBed.inject(Router).navigated;
    await settle();
    expect(texts(el, '[role="option"] .option-label')).toEqual([
      'Tous',
      'À rendre',
      'Rendus',
      'En attente de correction',
      'Corrigés',
      'Non rendus',
    ]);
    expect(texts(el, '[role="option"] .option-count')).toEqual([
      ', 2',
      ', 2',
      ', 0',
      ', 0',
      ', 0',
      ', 0',
    ]);
  });

  it('filtre par statut et mène à la fiche en gardant semaine et filtres', async () => {
    const { el } = await render({ week: '2026-09-14', status: 'GRADED' });
    const card = el.querySelector('app-assignment-card a');

    expect(el.querySelectorAll('app-assignment-card')).toHaveLength(1);
    expect(card?.querySelector('ui-grade')?.textContent).toContain('15/20');
    expect(card?.getAttribute('href')).toBe(
      `/c/${GRACE.childId}/homework/${MATHS_GRADED.evaluationId}?week=2026-09-14&status=GRADED`,
    );
  });

  it('dit quand un filtre ne trouve rien, et comment tout revoir', async () => {
    const { el } = await render({ status: 'MISSED' });

    expect(el.querySelector('ui-empty-period h2')?.textContent).toBe('Aucun devoir non rendu');
    expect(el.querySelector('ui-empty-period p')?.textContent).toBe(
      'Choisissez « Tous » pour tout revoir.',
    );
  });

  it('dit une semaine sans devoir', async () => {
    const { el } = await render({ week: '2026-10-05' });

    expect(el.querySelector('ui-empty-period h2')?.textContent).toBe('Aucun devoir cette semaine');
    expect(el.querySelector('[aria-label="Semaine suivante"]')?.getAttribute('aria-disabled')).toBe(
      'true',
    );
  });

  it('change de semaine par l’URL, remet le jour à toute la semaine, sans relancer d’appel', async () => {
    const homework = vi.fn(() => of(homeworkListFixture()));
    const { el, fixture } = await render({ day: '2026-09-23', status: 'DUE' }, homework);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    el.querySelector<HTMLButtonElement>('[aria-label="Semaine suivante"]')?.click();
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { date: null, week: '2026-09-28', day: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      }),
    );

    fixture.componentRef.setInput('week', '2026-09-28');
    fixture.componentRef.setInput('day', undefined);
    await fixture.whenStable();
    expect(texts(el, 'app-assignment-card .heading')).toEqual([
      'Devoir de Géographie — carte du relief.',
    ]);
    expect(homework).toHaveBeenCalledOnce();
  });

  it('ouvre la semaine d’un jour venu d’ailleurs (`?date=`)', async () => {
    const { el } = await render({ date: '2026-09-16' });

    expect(el.querySelector('app-week-banner .title')?.textContent).toBe('14 – 18 sept.');
    expect(el.querySelector('app-week-banner .relative')?.textContent).toBe('sem. passée');
  });

  it('montre la grille au grand écran : cinq colonnes, aujourd’hui cerné', async () => {
    wideScreen();
    const { el } = await render();

    expect(el.querySelector('app-week-banner .title')?.textContent).toBe(
      'Semaine du 21 au 25 septembre 2026',
    );
    expect(el.querySelectorAll('.column')).toHaveLength(5);
    expect(el.querySelector('.column.today .column-date')?.textContent).toBe('22/09');
    expect(texts(el, '.column-empty')).toEqual(['Rien à rendre', 'Rien à rendre', 'Rien à rendre']);
    expect(el.querySelectorAll('app-assignment-card.compact')).toHaveLength(3);
  });

  it('bascule en liste au grand écran, et le garde dans l’URL', async () => {
    wideScreen();
    const { el } = await render({ view: 'list' });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    expect(el.querySelector('.column')).toBeNull();
    expect(el.querySelectorAll('.day')).toHaveLength(2);
    el.querySelectorAll<HTMLButtonElement>('.view')[1].click();
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { date: null, view: null } }),
    );
  });

  it("propose de réessayer quand la liste n'a pas pu être chargée", async () => {
    let calls = 0;
    const { el, fixture } = await render({}, () =>
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
    expect(el.querySelectorAll('app-assignment-card')).toHaveLength(3);
  });
});
