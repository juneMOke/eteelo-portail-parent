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
});
