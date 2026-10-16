import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { GRACE, bootstrapFixture } from '../../../testing/bootstrap.fixture';
import { ParentApi } from '../../core/api/parent-api';
import { SessionStore } from '../../core/session/session.store';
import HomePage from './home.page';

describe('HomePage', () => {
  async function render() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'c/:childId', component: HomePage }], withComponentInputBinding()),
        { provide: ParentApi, useValue: { bootstrap: () => of(bootstrapFixture()) } },
      ],
    });
    await TestBed.inject(SessionStore).ensureLoaded();
    const harness = await RouterTestingHarness.create(`/c/${GRACE.childId}`);
    return harness.routeNativeElement as HTMLElement;
  }

  it("salue le parent et rappelle l'enfant affiché", async () => {
    const el = await render();

    expect(el.querySelector('.hello')?.textContent?.trim()).toBe('Mbote, Mme Léonie Kabila Mwamba');
    expect(el.querySelector('.child')?.textContent).toBe('Grâce Mbala Nsimba · 5e B');
  });

  it('mène à toutes les pages, en cinq groupes', async () => {
    const el = await render();

    expect([...el.querySelectorAll('h2')].map((h) => h.textContent)).toEqual([
      'Préparer ma semaine',
      'Mes notes',
      'Ma conduite',
      'Mes finances',
      'Ma communication',
    ]);
    expect(el.querySelectorAll('app-tile a')).toHaveLength(13);
  });

  it('renvoie vers Messages depuis le pied de page', async () => {
    const el = await render();

    expect(el.querySelector('.footer a')?.getAttribute('href')).toBe(
      `/c/${GRACE.childId}/messages`,
    );
  });
});
