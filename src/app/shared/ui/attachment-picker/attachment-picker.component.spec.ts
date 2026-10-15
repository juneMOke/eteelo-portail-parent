import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttachmentPickerComponent } from './attachment-picker.component';

registerLocaleData(localeFr);

describe('AttachmentPickerComponent', () => {
  const photo = new File(['x'.repeat(1_500)], 'certificat.jpg', { type: 'image/jpeg' });

  async function render() {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    const fixture = TestBed.createComponent(AttachmentPickerComponent);
    fixture.componentRef.setInput('accept', ['image/jpeg', 'application/pdf']);
    fixture.componentRef.setInput('maxBytes', 2_000);
    fixture.componentRef.setInput('chooseLabel', 'Joindre un certificat');
    fixture.componentRef.setInput('hint', 'Photo ou PDF · 2 Ko maximum');
    fixture.componentRef.setInput('formatMessage', 'Format accepté : photo ou PDF.');
    fixture.componentRef.setInput('tooLargeMessage', 'Ce fichier dépasse 2 Ko.');
    await fixture.whenStable();
    return fixture;
  }

  async function pick(fixture: ComponentFixture<AttachmentPickerComponent>, file: File) {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type=file]');
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }

  const text = (fixture: ComponentFixture<AttachmentPickerComponent>) =>
    (fixture.nativeElement as HTMLElement).textContent ?? '';

  it('propose de joindre un fichier, avec son rappel', async () => {
    const fixture = await render();

    expect(text(fixture)).toContain('Joindre un certificat');
    expect(text(fixture)).toContain('Photo ou PDF · 2 Ko maximum');
  });

  it('garde le fichier choisi, puis le retire', async () => {
    const fixture = await render();

    await pick(fixture, photo);
    expect(fixture.componentInstance.file()).toBe(photo);
    expect(text(fixture)).toContain('certificat.jpg');

    fixture.nativeElement.querySelector('[aria-label="Retirer certificat.jpg"]').click();
    await fixture.whenStable();
    expect(fixture.componentInstance.file()).toBeNull();
    expect(text(fixture)).toContain('Joindre un certificat');
  });

  it('refuse un fichier hors format ou trop lourd, avant l’envoi', async () => {
    const fixture = await render();

    await pick(fixture, new File(['x'], 'note.txt', { type: 'text/plain' }));
    expect(text(fixture)).toContain('Format accepté : photo ou PDF.');

    await pick(fixture, new File(['x'.repeat(3_000)], 'grand.jpg', { type: 'image/jpeg' }));
    expect(text(fixture)).toContain('Ce fichier dépasse 2 Ko.');
    expect(fixture.componentInstance.file()).toBeNull();
  });
});
