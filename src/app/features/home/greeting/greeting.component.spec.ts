import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GreetingComponent } from './greeting.component';

describe('GreetingComponent', () => {
  it('salue et date le jour en français', async () => {
    registerLocaleData(localeFr);
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    const fixture = TestBed.createComponent(GreetingComponent);
    fixture.componentRef.setInput('greeting', 'Mbote, Mme Kabila');
    fixture.componentRef.setInput('childLabel', 'Grâce · 5e B');
    fixture.componentRef.setInput('today', new Date(2026, 8, 23));
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.hello')?.textContent).toBe('Mbote, Mme Kabila');
    expect(el.querySelector('.meta')?.textContent).toBe('mercredi 23 septembre 2026 · Grâce · 5e B');
    expect(el.querySelector('h1, h2')).toBeNull();
  });
});
