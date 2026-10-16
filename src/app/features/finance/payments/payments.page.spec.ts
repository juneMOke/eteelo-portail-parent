import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { settle } from '../../../../testing/async';
import { GRACE, bootstrapFixture } from '../../../../testing/bootstrap.fixture';
import { stubDialog } from '../../../../testing/dialog';
import { FEE_ID, PAYMENT_ID, paymentsFixture } from '../../../../testing/finance.fixture';
import { plainText as text } from '../../../../testing/text';
import { Payment } from '../../../core/api/finance.contract';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';
import PaymentsPage from './payments.page';

registerLocaleData(localeFr);

describe('PaymentsPage', () => {
  beforeAll(stubDialog);

  async function render(payments: Payment[] = paymentsFixture(), payment?: string) {
    const api = {
      payments: vi.fn(() => of(payments)),
      receipt: vi.fn(() => of(new Blob(['%PDF']))),
      bootstrap: vi.fn(() => of(bootstrapFixture())),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'fr' },
        { provide: ParentApi, useValue: api },
      ],
    });
    await TestBed.inject(SessionStore).ensureLoaded();
    const fixture = TestBed.createComponent(PaymentsPage);
    fixture.componentRef.setInput('childId', GRACE.childId);
    if (payment) fixture.componentRef.setInput('payment', payment);
    await settle();
    await fixture.whenStable();
    return { fixture, api, el: fixture.nativeElement as HTMLElement };
  }

  it('range les versements de l’année par mois, le plus récent en haut, sans total recalculé', async () => {
    const { el, api } = await render();

    expect(api.payments).toHaveBeenCalledWith(GRACE.childId, undefined);
    expect([...el.querySelectorAll('ui-section-card h2')].map(text)).toEqual(['Septembre 2026']);
    expect(text(el.querySelector('ui-section-card .count'))).toBe('4 versements');
    expect([...el.querySelectorAll('app-finance-line .heading')].map(text)).toEqual([
      'Mardi 22/09 · Mobile money',
      'Samedi 12/09 · Espèces',
      'Samedi 05/09 · Espèces',
      'Jeudi 03/09 · Espèces',
    ]);
    expect(text(el.querySelector('app-finance-line .details'))).toBe(
      'Imputé sur : Frais scolaires · 1re tranche',
    );
    expect([...el.querySelectorAll('app-finance-line .amount')].map(text)).toEqual([
      '40 $',
      '50 000 FC',
      '140 $',
      '100 $',
    ]);
  });

  it('ouvre la fiche d’un versement par l’URL : référence copiable, perçu, frais couverts', async () => {
    const { el } = await render(undefined, PAYMENT_ID.registration);
    const sheet = el.querySelector('app-payment-sheet dialog')!;

    expect(sheet.hasAttribute('open')).toBe(true);
    expect(text(sheet.querySelector('.amount'))).toBe('100 $');
    expect(text(sheet.querySelector('.facts div:last-child dd'))).toBe(
      '280 000 FC au taux de 2 800 FC pour 1 $',
    );
    expect(sheet.querySelector('app-ledger-row a')?.getAttribute('href')).toBe(
      `/c/${GRACE.childId}/finance/fees?fee=${FEE_ID.registration}`,
    );
    expect(text(sheet.querySelector('.receipt-name'))).toBe('Reçu n° ETL-RC-2627-001031');
    expect(sheet.querySelector('app-receipt-actions a')?.getAttribute('href')).toBe(
      `/api/v1/parent/children/${GRACE.childId}/payments/${PAYMENT_ID.registration}/receipt`,
    );
  });

  it('dit un reçu pas encore émis, sans bouton grisé', async () => {
    const { el } = await render(undefined, PAYMENT_ID.airtel);
    const sheet = el.querySelector('app-payment-sheet dialog')!;

    expect(sheet.querySelector('ui-copy-button')).not.toBeNull();
    expect(text(sheet.querySelector('.receipt .none'))).toBe('Reçu en préparation.');
    expect(sheet.querySelector('app-receipt-actions')).toBeNull();
  });

  it('partage le reçu du versement ouvert', async () => {
    Object.assign(navigator, { canShare: () => true, share: vi.fn(async () => undefined) });
    const { el, api } = await render(undefined, PAYMENT_ID.cash);

    el.querySelector<HTMLButtonElement>('app-receipt-actions button')!.click();
    await settle();

    expect(api.receipt).toHaveBeenCalledWith(GRACE.childId, PAYMENT_ID.cash);
    expect(navigator.share).toHaveBeenCalledOnce();
    Reflect.deleteProperty(navigator, 'canShare');
    Reflect.deleteProperty(navigator, 'share');
  });

  it('dit une année sans versement et mène aux frais à payer', async () => {
    const { el } = await render([]);

    expect(text(el.querySelector('ui-empty-period h2'))).toBe(
      'Aucun versement enregistré cette année.',
    );
    expect(el.querySelector('ui-empty-period a')?.getAttribute('href')).toBe(
      `/c/${GRACE.childId}/finance/fees`,
    );
  });
});
