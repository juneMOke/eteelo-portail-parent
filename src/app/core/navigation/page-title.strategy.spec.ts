import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { PageTitleStrategy } from './page-title.strategy';

@Component({ template: '' })
class BlankComponent {}

describe('PageTitleStrategy', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', title: 'Accueil', data: { home: true }, component: BlankComponent },
          { path: 'fees', title: 'Mes frais', component: BlankComponent },
          {
            path: 'assessments/:evaluationId',
            title: 'Mes évaluations',
            data: { back: 'assessments' },
            component: BlankComponent,
          },
        ]),
        { provide: TitleStrategy, useExisting: PageTitleStrategy },
      ],
    });
  });

  it("expose le titre de la page et signale l'Accueil", async () => {
    const router = TestBed.inject(Router);
    const strategy = TestBed.inject(PageTitleStrategy);

    await router.navigateByUrl('/');
    expect(strategy.title()).toBe('Accueil');
    expect(strategy.isHome()).toBe(true);

    await router.navigateByUrl('/fees');
    expect(strategy.title()).toBe('Mes frais');
    expect(strategy.isHome()).toBe(false);
    expect(TestBed.inject(Title).getTitle()).toBe('Mes frais · Portail parent · ETEELO CONNECT');
  });

  it("ramène à l'Accueil par défaut", async () => {
    await TestBed.inject(Router).navigateByUrl('/fees?date=2026-09-24');

    expect(TestBed.inject(PageTitleStrategy).back()).toEqual({
      entry: expect.objectContaining({ id: 'home' }),
      queryParams: {},
    });
  });

  it("ramène une fiche à sa liste, au jour d'où l'on vient", async () => {
    const router = TestBed.inject(Router);
    const strategy = TestBed.inject(PageTitleStrategy);

    await router.navigateByUrl('/assessments/41e0?date=2026-09-24');
    expect(strategy.back()).toEqual({
      entry: expect.objectContaining({ id: 'assessments', title: 'Mes évaluations' }),
      queryParams: { date: '2026-09-24' },
    });

    await router.navigateByUrl('/assessments/41e0');
    expect(strategy.back().queryParams).toEqual({});
  });
});
