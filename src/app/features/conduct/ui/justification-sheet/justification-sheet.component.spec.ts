import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { stubDialog } from '../../../../../testing/dialog';
import { JustificationSheetComponent } from './justification-sheet.component';

registerLocaleData(localeFr);

describe('JustificationSheetComponent', () => {
  beforeAll(stubDialog);

  async function render() {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    const fixture = TestBed.createComponent(JustificationSheetComponent);
    await fixture.whenStable();
    fixture.componentInstance.open('2026-10-02');
    await fixture.whenStable();
    const sent = vi.fn();
    fixture.componentInstance.send.subscribe(sent);
    return { fixture, sent, el: fixture.nativeElement as HTMLElement };
  }

  const button = (el: HTMLElement, label: string) =>
    [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === label)!;

  async function type(fixture: ComponentFixture<JustificationSheetComponent>, note: string) {
    const area = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    area.value = note;
    area.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  it('demande un motif avant d’envoyer', async () => {
    const { fixture, el, sent } = await render();

    expect(el.querySelector('h2')?.textContent).toBe('Justifier l’absence du vendredi 02/10');
    expect(button(el, 'Envoyer').disabled).toBe(true);

    button(el, 'Maladie').click();
    await fixture.whenStable();
    button(el, 'Envoyer').click();

    expect(sent).toHaveBeenCalledWith({
      date: '2026-10-02',
      draft: { reason: 'SICKNESS', note: '', file: null },
    });
  });

  it('demande une précision pour « Autre »', async () => {
    const { fixture, el } = await render();

    button(el, 'Autre').click();
    await fixture.whenStable();
    expect(button(el, 'Envoyer').disabled).toBe(true);

    await type(fixture, 'Cérémonie familiale');
    expect(button(el, 'Envoyer').disabled).toBe(false);
  });

  it('garde la saisie après un échec et propose de réessayer', async () => {
    const { fixture, el } = await render();
    button(el, 'Transport').click();
    await type(fixture, 'Pas de bus');

    fixture.componentRef.setInput('failure', {
      message: 'L’envoi n’a pas abouti.',
      retryable: true,
    });
    await fixture.whenStable();

    expect(el.querySelector('[role=alert]')?.textContent).toBe('L’envoi n’a pas abouti.');
    expect(button(el, 'Réessayer').disabled).toBe(false);
    expect(el.querySelector('textarea')?.value).toBe('Pas de bus');
  });

  it('oublie la saisie une fois la justification reçue', async () => {
    const { fixture, el } = await render();
    button(el, 'Maladie').click();
    await type(fixture, 'Fièvre');

    fixture.componentInstance.done();
    fixture.componentInstance.open('2026-10-02');
    await fixture.whenStable();

    expect(el.querySelector('textarea')?.value).toBe('');
    expect(button(el, 'Envoyer').disabled).toBe(true);
  });
});
