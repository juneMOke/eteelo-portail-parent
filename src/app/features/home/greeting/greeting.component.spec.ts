import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GreetingComponent } from './greeting.component';

describe('GreetingComponent', () => {
  async function render(parentName: string | null, childClass: string | null) {
    registerLocaleData(localeFr);
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    const fixture = TestBed.createComponent(GreetingComponent);
    fixture.componentRef.setInput('parentName', parentName);
    fixture.componentRef.setInput('childName', 'Grâce Mbala Nsimba');
    fixture.componentRef.setInput('childClass', childClass);
    fixture.componentRef.setInput('today', new Date(2026, 8, 23));
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it("salue le parent, montre l'élève et sa classe en pastille, et date le jour en français", async () => {
    const el = await render('Mme Léonie Kabila Mwamba', '5e B');

    expect(el.querySelector('.hello')?.textContent?.trim()).toBe('Mbote, Mme Léonie Kabila Mwamba');
    expect(el.querySelector('.parent')?.textContent).toBe('Mme Léonie Kabila Mwamba');
    expect(el.querySelector('.child')?.textContent).toBe('Grâce Mbala Nsimba · 5e B');
    expect(el.querySelector('.meta')?.textContent).toBe('mercredi 23 septembre 2026');
    expect(el.querySelector('h1, h2')).toBeNull();
  });

  it('dit « Mbote » seul sans nom, et le nom seul sans classe', async () => {
    const el = await render(null, null);

    expect(el.querySelector('.hello')?.textContent?.trim()).toBe('Mbote');
    expect(el.querySelector('.parent')).toBeNull();
    expect(el.querySelector('.child')?.textContent).toBe('Grâce Mbala Nsimba');
  });
});
