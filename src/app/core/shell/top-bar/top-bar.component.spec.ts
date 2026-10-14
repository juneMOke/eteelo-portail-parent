import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DAVID, GRACE, bootstrapFixture } from '../../../../testing/bootstrap.fixture';
import { TopBarComponent } from './top-bar.component';

describe('TopBarComponent', () => {
  async function render(inputs: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TopBarComponent);
    const defaults = { school: bootstrapFixture().school, child: GRACE, title: 'Accueil' };
    for (const [name, value] of Object.entries({ ...defaults, ...inputs })) {
      fixture.componentRef.setInput(name, value);
    }
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it("présente l'école, l'enfant et le titre de la page", async () => {
    const el = await render();

    expect(el.querySelector('.school-name')?.textContent).toBe('Complexe Scolaire La Fontaine');
    expect(el.querySelector('.crest')?.textContent).toBe('CS');
    expect(el.querySelector('h1')?.textContent).toBe('Accueil');
    expect(el.querySelector('.help')?.textContent).toContain(
      'Enfant affiché : Grâce (5e B). Touchez le bouton clair',
    );
  });

  it("n'a pas de bouton retour sur l'Accueil", async () => {
    const el = await render({ showBack: false });

    expect(el.querySelector('.back')).toBeNull();
  });

  it("ramène à l'Accueil depuis les autres pages", async () => {
    const el = await render({ showBack: true, title: 'Mes frais' });
    const back = el.querySelector('.back');

    expect(back?.getAttribute('href')).toBe(`/c/${GRACE.childId}`);
    expect(back?.textContent).toContain('Accueil');
  });

  it('donne accès aux messages et notifications, libellés', async () => {
    const el = await render();
    const actions = [...el.querySelectorAll('.action')];

    expect(actions.map((a) => a.getAttribute('aria-label'))).toEqual([
      'Mes messages',
      'Mes notifications',
    ]);
    expect(actions[1].getAttribute('href')).toBe(`/c/${GRACE.childId}/notifications`);
  });

  it("n'invite pas à changer d'enfant quand il n'y en a qu'un", async () => {
    const el = await render({ child: DAVID, interactive: false });

    expect(el.querySelector('.help')?.textContent?.trim()).toBe('Enfant affiché : David.');
  });
});
