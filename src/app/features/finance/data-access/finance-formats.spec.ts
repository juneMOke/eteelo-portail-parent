import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  AIRTEL_PAYMENT,
  CASH_PAYMENT,
  DUE_FEE,
  OVERDUE_FEE,
  PAID_FEE,
  PARTIAL_FEE,
  REGISTRATION_PAYMENT,
  TRANSPORT_PAYMENT,
  feesFixture,
  paymentsFixture,
} from '../../../../testing/finance.fixture';
import {
  asOfLabel,
  feeStateView,
  feeStatePill,
  methodView,
  feeCategoryIcon,
  feeSubline,
  longDate,
  overdueHeadline,
  shortFeeLabel,
  payerName,
  allocationsLabel,
  paymentMonths,
  paymentTitle,
  receiptMeta,
  receivedLabel,
  spokenFee,
} from './finance-formats';

registerLocaleData(localeFr);

/** Les espaces fines des montants, écrites en espaces simples pour lire les attentes. */
const plain = (label: string | null) => label?.replaceAll(' ', ' ');

describe('finance-formats', () => {
  it('donne à chaque état son mot et son ton, et laisse neutre un état inconnu', () => {
    expect(feeStateView('OVERDUE')).toEqual({ label: 'En retard', tone: 'alert' });
    expect(feeStateView('PARTIAL')).toEqual({ label: 'Partiel', tone: 'pending' });
    expect(feeStateView('DUE')).toEqual({ label: 'À payer', tone: 'info' });
    expect(feeStateView('PAID')).toEqual({ label: 'Payé', tone: 'success' });
    expect(feeStateView('WAIVED')).toBeNull();
  });

  it('écrit la pastille d’état d’un frais : le mot et sa date', () => {
    expect(feeStatePill(OVERDUE_FEE, 'fr')).toBe('En retard depuis le 15/09');
    expect(feeStatePill(PARTIAL_FEE, 'fr')).toBe('Partiel · avant le 10/10');
    expect(feeStatePill(DUE_FEE, 'fr')).toBe('À payer avant le 15/12');
    expect(feeStatePill(PAID_FEE, 'fr')).toBe('Payé le 03/09');
    expect(feeStatePill({ ...DUE_FEE, dueDate: null }, 'fr')).toBe('À payer');
  });

  it('dit une ligne de frais en entier pour un lecteur d’écran', () => {
    expect(plain(spokenFee(OVERDUE_FEE, 'fr'))).toBe(
      'Frais scolaires, 1re tranche, 260 dollars, en retard depuis le mardi 15 septembre, 80 dollars restant.',
    );
    expect(spokenFee(PAID_FEE, 'fr')).toBe('Frais d’inscription, 100 dollars, payé.');
  });

  it('écrit le bilan d’une devise et sa date de situation', () => {
    const [usd] = feesFixture().totals;

    expect(usd.currency).toBe('USD');
    expect(asOfLabel('2026-09-23T06:40:00Z', 'fr')).toMatch(
      /^Situation au 23\/09 · \d{2}\u00a0h\u00a040$/,
    );
  });

  it('nomme un frais en retard, et compte plusieurs frais avec leur reste par devise', () => {
    const { totals } = feesFixture();

    expect(plain(overdueHeadline([OVERDUE_FEE], totals, 'fr'))).toBe(
      '1re tranche · 80 $ en retard depuis le 15/09',
    );
    const twoCurrencies = [
      { ...totals[0], overdueInCents: 22_000, overdueCount: 1 },
      { ...totals[1], overdueInCents: 10_000_000, overdueCount: 1 },
    ];
    expect(plain(overdueHeadline([OVERDUE_FEE, PARTIAL_FEE], twoCurrencies, 'fr'))).toBe(
      '2 frais · 220 $ · 100 000 FC à payer',
    );
  });

  it('nomme un frais sans répéter sa catégorie, et lui donne l’icône de sa catégorie', () => {
    expect(shortFeeLabel(OVERDUE_FEE)).toBe('1re tranche');
    expect(shortFeeLabel({ ...OVERDUE_FEE, section: null })).toBe('Frais scolaires · 1re tranche');
    expect(shortFeeLabel({ ...OVERDUE_FEE, label: 'Minerval' })).toBe('Minerval');
    expect(feeSubline(OVERDUE_FEE, 'fr')).toBe('Frais scolaires · échéance le 15/09');
    expect(feeSubline({ ...OVERDUE_FEE, section: null, dueDate: null }, 'fr')).toBeNull();
    expect(longDate('2026-09-15', 'fr')).toBe('15 septembre 2026');
    expect(
      feeCategoryIcon({ ...OVERDUE_FEE, section: { code: 'TUITION', title: 'Minerval' } }),
    ).toBe('graduation-cap');
    expect(feeCategoryIcon({ ...OVERDUE_FEE, section: { code: 'BOOKS', title: 'Manuels' } })).toBe(
      'book-open',
    );
    expect(feeCategoryIcon({ ...OVERDUE_FEE, section: null, feeCode: 'OTHER' })).toBe('receipt');
  });

  it('écrit un versement : jour, moyen, frais couverts et payeur', () => {
    expect(paymentTitle(AIRTEL_PAYMENT, 'fr')).toBe('Mardi 22/09 · Mobile money');
    expect(allocationsLabel(AIRTEL_PAYMENT)).toBe('Imputé sur : Frais scolaires · 1re tranche');
    expect(
      payerName({ payerFirstName: null, payerLastName: null, payerMiddleName: null }),
    ).toBeNull();
    expect(methodView('CASH')).toEqual({ label: 'Espèces', icon: 'banknote' });
    expect(methodView('CHEQUE').label).toBe('Autre moyen');
  });

  it('montre le perçu au taux du guichet seulement quand il diffère de l’imputé', () => {
    expect(plain(receivedLabel(REGISTRATION_PAYMENT.received, 'fr'))).toBe(
      '280 000 FC au taux de 2 800 FC pour 1 $',
    );
    expect(receivedLabel(TRANSPORT_PAYMENT.received, 'fr')).toBeNull();
  });

  it('écrit la ligne d’un reçu', () => {
    expect(receiptMeta(CASH_PAYMENT, 'fr')).toBe('Sam. 5 sept. · Espèces');
  });

  it('range le journal par mois, dans l’ordre du serveur, sans total calculé', () => {
    const months = paymentMonths(
      [...paymentsFixture(), { ...CASH_PAYMENT, paidAt: '2026-08-28T10:00:00Z' }],
      'fr',
    );

    expect(months.map((month) => month.label)).toEqual(['Septembre 2026', 'Août 2026']);
    expect(months[0].payments).toHaveLength(4);
  });
});
