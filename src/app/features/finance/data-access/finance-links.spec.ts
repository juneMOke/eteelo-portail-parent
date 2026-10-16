import { feeParams, feesLink, paymentParams, paymentsLink } from './finance-links';

describe('finance-links', () => {
  it('mène d’une page à l’autre, la fiche ouverte', () => {
    expect(feesLink('c1')).toEqual(['/c', 'c1', 'finance', 'fees']);
    expect(paymentsLink('c1')).toEqual(['/c', 'c1', 'finance', 'payments']);
    expect(feeParams('f1')).toEqual({ fee: 'f1' });
    expect(paymentParams('p1')).toEqual({ payment: 'p1' });
  });
});
