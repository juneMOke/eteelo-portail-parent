import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FileRowComponent } from './file-row.component';

registerLocaleData(localeFr);

describe('FileRowComponent', () => {
  async function render(removable = true) {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    const fixture = TestBed.createComponent(FileRowComponent);
    fixture.componentRef.setInput('file', new File(['x'.repeat(1_500)], 'copie.pdf'));
    fixture.componentRef.setInput('removable', removable);
    await fixture.whenStable();
    return fixture;
  }

  it('montre le nom et le poids du fichier, et propose de le retirer', async () => {
    const fixture = await render();
    const removed = vi.fn();
    fixture.componentInstance.remove.subscribe(removed);
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('copie.pdf');
    expect(el.textContent).toContain('2 Ko');
    el.querySelector<HTMLButtonElement>('[aria-label="Retirer copie.pdf"]')!.click();
    expect(removed).toHaveBeenCalled();
  });

  it('ne propose pas de le retirer pendant l’envoi', async () => {
    const fixture = await render(false);

    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
});
