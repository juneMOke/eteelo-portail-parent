import { TestBed } from '@angular/core/testing';
import { AuthFacade } from '../data-access/auth.facade';
import { failingWith, settle } from '../../../../testing/async';
import LoginPage from './login.page';

describe('LoginPage', () => {
  let auth: { requestLink: (phoneNumber: string) => Promise<void> };

  async function render(error?: string) {
    TestBed.configureTestingModule({ providers: [{ provide: AuthFacade, useValue: auth }] });
    const fixture = TestBed.createComponent(LoginPage);
    if (error) fixture.componentRef.setInput('error', error);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const submit = async (value: string) => {
      const input = el.querySelector('input') as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      el.querySelector('form')?.dispatchEvent(new Event('submit'));
      await settle();
      await fixture.whenStable();
    };
    return { el, submit };
  }

  beforeEach(() => (auth = { requestLink: vi.fn().mockResolvedValue(undefined) }));

  it('envoie le numéro au format international puis confirme l’envoi', async () => {
    const { el, submit } = await render();

    await submit('081 563 2080');

    expect(auth.requestLink).toHaveBeenCalledWith('+243815632080');
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Lien envoyé');
  });

  it('refuse un numéro invalide sans appeler le serveur', async () => {
    const { el, submit } = await render();

    await submit('123');

    expect(auth.requestLink).not.toHaveBeenCalled();
    expect(el.querySelector('.field-error')?.textContent).toContain('numéro de mobile valide');
    expect(el.querySelector('input')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('signale un échec d’envoi', async () => {
    auth = { requestLink: failingWith(new Error('réseau')) };
    const { el, submit } = await render();

    await submit('0815632080');

    expect(el.querySelector('.alert')?.textContent).toContain('L’envoi a échoué');
  });

  it('explique une erreur réseau au retour du garde de session', async () => {
    const { el } = await render('network');

    expect(el.querySelector('.alert')?.textContent).toContain('Connexion au serveur impossible');
  });
});
