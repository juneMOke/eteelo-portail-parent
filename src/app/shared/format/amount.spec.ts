import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { amountLabel, amountsLabel, spokenAmount } from './amount';

registerLocaleData(localeFr);

describe('amount', () => {
  it('écrit un montant à la française : espace fine, symbole après, centimes s’il y en a', () => {
    expect(amountLabel({ amountInCents: 124_000, currency: 'USD' }, 'fr')).toBe('1 240 $');
    expect(amountLabel({ amountInCents: 22_400_000, currency: 'CDF' }, 'fr')).toBe('224 000 FC');
    expect(amountLabel({ amountInCents: 1250, currency: 'USD' }, 'fr')).toBe('12,50 $');
    expect(amountLabel({ amountInCents: 500, currency: 'XAF' }, 'fr')).toBe('5 XAF');
  });

  it('pose plusieurs devises côte à côte, sans les additionner', () => {
    expect(
      amountsLabel(
        [
          { amountInCents: 8000, currency: 'USD' },
          { amountInCents: 5_000_000, currency: 'CDF' },
        ],
        'fr',
      ),
    ).toBe('80 $ · 50 000 FC');
  });

  it('dit un montant en toutes lettres pour un lecteur d’écran', () => {
    expect(spokenAmount({ amountInCents: 26_000, currency: 'USD' }, 'fr')).toBe('260 dollars');
    expect(spokenAmount({ amountInCents: 100, currency: 'USD' }, 'fr')).toBe('1 dollar');
    expect(spokenAmount({ amountInCents: 22_400_000, currency: 'CDF' }, 'fr')).toBe(
      '224 000 francs congolais',
    );
  });
});
