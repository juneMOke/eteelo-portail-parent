import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthFacade } from '../data-access/auth.facade';
import { failingWith, settle } from '../../../../testing/async';
import MagicLinkPage from './magic-link.page';

describe('MagicLinkPage', () => {
  let auth: { openSession: (token: string) => Promise<string | null> };

  async function render() {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthFacade, useValue: auth }],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(MagicLinkPage);
    fixture.componentRef.setInput('token', 'jeton');
    await fixture.whenStable();
    await settle();
    await fixture.whenStable();
    return { el: fixture.nativeElement as HTMLElement, navigate };
  }

  beforeEach(() => (auth = { openSession: vi.fn().mockResolvedValue(null) }));

  it("ouvre la session puis mène à l'Accueil", async () => {
    const { navigate } = await render();

    expect(auth.openSession).toHaveBeenCalledWith('jeton');
    expect(navigate).toHaveBeenCalledWith('/', { replaceUrl: true });
  });

  it('mène à la page demandée avant la connexion', async () => {
    auth = { openSession: vi.fn().mockResolvedValue('/c/abc/messages?announcement=a1') };
    const { navigate } = await render();

    expect(navigate).toHaveBeenCalledWith('/c/abc/messages?announcement=a1', { replaceUrl: true });
  });

  it('propose un nouveau lien quand celui-ci a expiré', async () => {
    auth = { openSession: failingWith(new Error('401')) };
    const { el } = await render();

    expect(el.querySelector('.alert')?.textContent).toContain('plus valide');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/login');
  });
});
