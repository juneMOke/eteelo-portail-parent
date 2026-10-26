import { TestBed } from '@angular/core/testing';
import { PushStatus } from '../../../../core/push/push.store';
import { PushCardComponent } from './push-card.component';

describe('PushCardComponent', () => {
  async function render(status: PushStatus, inputs: { busy?: boolean; failed?: boolean } = {}) {
    const fixture = TestBed.createComponent(PushCardComponent);
    fixture.componentRef.setInput('status', status);
    fixture.componentRef.setInput('busy', inputs.busy ?? false);
    fixture.componentRef.setInput('failed', inputs.failed ?? false);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('propose l’activation, une carte avec son bouton', async () => {
    const { fixture, el } = await render('available');
    const enable = vi.fn();
    fixture.componentInstance.enable.subscribe(enable);

    expect(el.classList).toContain('offer');
    expect(el.querySelector('.heading')?.textContent).toBe('Être prévenu quand l’école écrit');
    el.querySelector('button')?.click();
    expect(enable).toHaveBeenCalledOnce();
  });

  it('désactive le bouton pendant l’envoi', async () => {
    const { el } = await render('available', { busy: true });
    expect(el.querySelector('button')?.disabled).toBe(true);
  });

  it('activées : une ligne discrète qui permet de les couper', async () => {
    const { fixture, el } = await render('enabled');
    const disable = vi.fn();
    fixture.componentInstance.disable.subscribe(disable);

    expect(el.classList).not.toContain('offer');
    expect(el.textContent).toContain('Notifications activées sur ce téléphone');
    el.querySelector('button')?.click();
    expect(disable).toHaveBeenCalledOnce();
  });

  it('bloquées ou iPhone : explique, sans bouton', async () => {
    const denied = await render('denied');
    expect(denied.el.textContent).toContain('réglages du navigateur');
    expect(denied.el.querySelector('button')).toBeNull();

    const iphone = await render('install-first');
    expect(iphone.el.textContent).toContain('écran d’accueil');
    expect(iphone.el.querySelector('button')).toBeNull();
  });

  it('service de push refusé par le serveur : renvoie vers Chrome, sans bouton', async () => {
    const { el } = await render('unsupported-service');
    expect(el.textContent).toContain('Ouvrez le portail dans Chrome');
    expect(el.querySelector('button')).toBeNull();
  });

  it('signale l’échec selon le geste', async () => {
    const enabling = await render('available', { failed: true });
    expect(enabling.el.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      'Impossible d’activer les notifications. Vérifiez la connexion, puis réessayez.',
    );

    const disabling = await render('enabled', { failed: true });
    expect(disabling.el.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      'Impossible de désactiver les notifications. Réessayez.',
    );
  });
});
