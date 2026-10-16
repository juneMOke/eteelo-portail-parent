import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AmountPipe } from './amount.pipe';

registerLocaleData(localeFr);

describe('AmountPipe', () => {
  function pipe(): AmountPipe {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    return TestBed.runInInjectionContext(() => new AmountPipe());
  }

  it('écrit un montant ou une liste de montants, chacun dans sa devise', () => {
    const amount = pipe();

    expect(amount.transform({ amountInCents: 8000, currency: 'USD' })).toBe('80 $');
    expect(
      amount.transform([
        { amountInCents: 8000, currency: 'USD' },
        { amountInCents: 22_400_000, currency: 'CDF' },
      ]),
    ).toBe('80 $ · 224 000 FC');
  });
});
