import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileUploadComponent } from './file-upload.component';

registerLocaleData(localeFr);

describe('FileUploadComponent', () => {
  const pdf = new File(['%PDF-1.7'], 'copie.pdf', { type: 'application/pdf' });
  const photo = new File(['x'.repeat(1_500)], 'page-1.jpg', { type: 'image/jpeg' });

  async function render(inputs: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    const fixture = TestBed.createComponent(FileUploadComponent);
    const all: Record<string, unknown> = {
      accept: ['application/pdf', 'image/jpeg'],
      maxTotalBytes: 2_000,
      maxFiles: 2,
      hint: 'PDF ou photo · 2 Ko maximum',
      formatMessage: 'Format accepté : PDF ou photo.',
      tooLargeMessage: 'Ce dépôt dépasse 2 Ko.',
      tooManyMessage: 'Deux fichiers au plus.',
      ...inputs,
    };
    for (const [name, value] of Object.entries(all)) fixture.componentRef.setInput(name, value);
    await fixture.whenStable();
    return fixture;
  }

  async function pick(fixture: ComponentFixture<FileUploadComponent>, ...files: File[]) {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type=file]');
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }

  const text = (fixture: ComponentFixture<FileUploadComponent>) =>
    (fixture.nativeElement as HTMLElement).textContent ?? '';
  const button = (fixture: ComponentFixture<FileUploadComponent>, label: string) =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === label,
    );

  it('propose de choisir un fichier, avec le rappel du format et du poids', async () => {
    const fixture = await render();

    expect(button(fixture, 'Choisir un fichier')).toBeDefined();
    expect(text(fixture)).toContain('PDF ou photo · 2 Ko maximum');
  });

  it('montre le fichier choisi sans l’envoyer, puis l’envoie sur « Envoyer »', async () => {
    const fixture = await render();
    const sent = vi.fn();
    fixture.componentInstance.send.subscribe(sent);

    await pick(fixture, pdf);
    expect(text(fixture)).toContain('copie.pdf');
    expect(text(fixture)).toContain('1 Ko');
    expect(sent).not.toHaveBeenCalled();

    button(fixture, 'Envoyer')?.click();
    expect(sent).toHaveBeenCalledWith([pdf]);
  });

  it('regroupe plusieurs pages en un seul dépôt', async () => {
    const fixture = await render({ maxTotalBytes: 10_000 });

    await pick(fixture, photo);
    button(fixture, 'Ajouter une page')?.click();
    await pick(fixture, pdf);

    expect(fixture.componentInstance.files()).toEqual([photo, pdf]);
  });

  it('refuse avant l’envoi un format non accepté ou un dépôt trop lourd', async () => {
    const fixture = await render();

    await pick(fixture, new File(['x'], 'copie.heic', { type: 'image/heic' }));
    expect(text(fixture)).toContain('Format accepté : PDF ou photo.');

    await pick(fixture, photo, photo);
    expect(text(fixture)).toContain('Ce dépôt dépasse 2 Ko.');
    expect(fixture.componentInstance.files()).toEqual([]);
  });

  it('montre la progression et retire les boutons pendant l’envoi', async () => {
    const fixture = await render();
    await pick(fixture, pdf);

    fixture.componentRef.setInput('progress', 0.42);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('progress')?.value).toBe(42);
    expect(text(fixture)).toContain('Envoi en cours… 42 %');
    expect(button(fixture, 'Envoyer')).toBeUndefined();
  });

  it('propose de réessayer un envoi interrompu, pas un envoi refusé', async () => {
    const fixture = await render();
    await pick(fixture, pdf);

    fixture.componentRef.setInput('failure', {
      message: 'L’envoi n’a pas abouti.',
      retryable: true,
    });
    await fixture.whenStable();
    expect(text(fixture)).toContain('L’envoi n’a pas abouti.');
    expect(button(fixture, 'Réessayer')).toBeDefined();

    fixture.componentRef.setInput('failure', { message: 'Dépôt fermé.', retryable: false });
    await fixture.whenStable();
    expect(button(fixture, 'Réessayer')).toBeUndefined();
    expect(button(fixture, 'Changer')).toBeDefined();
  });
});
