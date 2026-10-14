import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { DAVID, GRACE, bootstrapFixture } from '../../../testing/bootstrap.fixture';
import { ParentApi } from '../api/parent-api';
import { PageTitleStrategy } from '../navigation/page-title.strategy';
import { SessionStore } from '../session/session.store';
import ShellComponent from './shell.component';

@Component({ template: '<p>page</p>' })
class PageStub {}

describe('ShellComponent', () => {
  async function setup(children = [GRACE, DAVID]) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            {
              path: 'c/:childId',
              component: ShellComponent,
              children: [
                { path: '', title: 'Accueil', data: { home: true }, component: PageStub },
                { path: 'finance/fees', title: 'Mes frais', component: PageStub },
                { path: 'assessments', title: 'Mes évaluations', component: PageStub },
                {
                  path: 'assessments/:evaluationId',
                  title: 'Mes évaluations',
                  data: { back: 'assessments' },
                  component: PageStub,
                },
              ],
            },
          ],
          withComponentInputBinding(),
        ),
        { provide: TitleStrategy, useExisting: PageTitleStrategy },
        { provide: ParentApi, useValue: { bootstrap: () => of(bootstrapFixture(children)) } },
      ],
    });
    await TestBed.inject(SessionStore).ensureLoaded();
    return RouterTestingHarness.create();
  }

  it('encadre la page : barre haute, menu et contenu', async () => {
    const harness = await setup();
    await harness.navigateByUrl(`/c/${GRACE.childId}`);
    const el = harness.routeNativeElement as HTMLElement;

    expect(el.querySelector('app-top-bar h1')?.textContent).toBe('Accueil');
    expect(el.querySelector('app-side-nav')).not.toBeNull();
    expect(el.querySelector('main p')?.textContent).toBe('page');
    expect(el.querySelector('app-top-bar .back')).toBeNull();
  });

  it('garde la même page en changeant d’enfant', async () => {
    const harness = await setup();
    await harness.navigateByUrl(`/c/${GRACE.childId}/finance/fees`);
    const el = harness.routeNativeElement as HTMLElement;

    el.querySelectorAll<HTMLButtonElement>('app-side-nav [role="radio"]')[1].click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe(`/c/${DAVID.childId}/finance/fees`);
    expect(el.querySelector('app-top-bar .back')).not.toBeNull();
  });

  it("mène à la liste de l'autre enfant depuis une fiche, qui n'est pas la sienne", async () => {
    const harness = await setup();
    await harness.navigateByUrl(`/c/${GRACE.childId}/assessments/41e0?date=2026-09-15`);
    const el = harness.routeNativeElement as HTMLElement;

    el.querySelectorAll<HTMLButtonElement>('app-side-nav [role="radio"]')[1].click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe(`/c/${DAVID.childId}/assessments`);
  });

  it('rend la pilule inerte avec un seul enfant', async () => {
    const harness = await setup([GRACE]);
    await harness.navigateByUrl(`/c/${GRACE.childId}`);
    const el = harness.routeNativeElement as HTMLElement;

    expect(el.querySelector('app-child-pill button')).toBeNull();
  });
});
