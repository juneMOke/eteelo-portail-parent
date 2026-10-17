import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { settle } from '../../../../testing/async';
import { GRACE, bootstrapFixture } from '../../../../testing/bootstrap.fixture';
import { stubDialog } from '../../../../testing/dialog';
import {
  ACADEMIC_YEARS,
  FEE_ID,
  PAYMENT_ID,
  YEAR,
  paymentsFixture,
} from '../../../../testing/finance.fixture';
import { plainText as text } from '../../../../testing/text';
import { AcademicYear, Payment } from '../../../core/api/finance.contract';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';
import PaymentsPage from './payments.page';

registerLocaleData(localeFr);

describe('PaymentsPage', () => {
  beforeAll(stubDialog);

  async function render(
    payments?: Payment[],
    payment?: string,
    options: { year?: string; years?: readonly AcademicYear[] } = {},
  ) {
    const api = {
      payments: vi.fn((_: string, year?: string) => of(payments ?? paymentsFixture(year))),
      academicYears: vi.fn(() => of([...(options.years ?? ACADEMIC_YEARS)])),
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
    if (options.year) fixture.componentRef.setInput('year', options.year);
    await settle();
    await fixture.whenStable();
    return { fixture, api, el: fixture.nativeElement as HTMLElement };
  }

  it('range les versements de l’année par mois, le plus récent en haut, sans total recalculé', async () => {
    const { el, api } = await render();

    expect(api.payments).toHaveBeenCalledWith(GRACE.childId, undefined);
    expect(text(el.querySelector('app-year-banner ui-filter-menu .value-label'))).toBe('2026-2027');
    expect(text(el.querySelector('ui-filter-menu .value-count'))).toBe('· 4 versements');
    expect([...el.querySelectorAll('ui-section-card h2')].map(text)).toEqual(['Septembre 2026']);
    expect(text(el.querySelector('ui-section-card .count'))).toBe('4 versements');
    expect([...el.querySelectorAll('app-finance-line .heading')].map(text)).toEqual([
      'Mardi 22/09 · Mobile money',
      'Samedi 12/09 · Espèces',
      'Samedi 05/09 · Espèces',
      'Jeudi 03/09 · Espèces',
    ]);
    expect(text(el.querySelector('app-finance-line .compact-heading'))).toBe(
      'Mar. 22/09 · Mobile money',
    );
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

  it('ouvre la fiche d’un versement par l’URL : montant en titre, référence, perçu, frais couverts', async () => {
    const { el } = await render(undefined, PAYMENT_ID.registration);
    const sheet = el.querySelector('app-payment-sheet dialog')!;

    expect(sheet.hasAttribute('open')).toBe(true);
    expect(sheet.getAttribute('aria-label')).toBe('Jeudi 03/09 · Espèces');
    expect(text(sheet.querySelector('h2'))).toBe('100 $');
    expect(text(sheet.querySelector('ui-badge'))).toBe('Enregistré');
    expect(text(sheet.querySelector('.sub'))).toMatch(/^Jeudi 3 septembre 2026 · \d+ h \d\d$/);
    expect(text(sheet.querySelector('.received dd'))).toBe(
      '280 000 FC au taux de 2 800 FC pour 1 $',
    );
    expect(text(sheet.querySelector('#payment-fees'))).toBe('Imputé sur · 1 frais');
    expect(sheet.querySelector('app-ledger-row a')?.getAttribute('href')).toBe(
      `/c/${GRACE.childId}/finance/fees?fee=${FEE_ID.registration}`,
    );
    expect(text(sheet.querySelector('.receipt-name'))).toBe('Reçu n° ETL-RC-2627-001031');
    expect(text(sheet.querySelector('app-receipt-actions a'))).toBe('Ouvrir');
    expect(sheet.querySelector('app-receipt-actions a')?.getAttribute('href')).toBe(
      `/api/v1/parent/children/${GRACE.childId}/payments/${PAYMENT_ID.registration}/receipt`,
    );
  });

  it('dit un reçu pas encore émis, sans bouton grisé', async () => {
    const { el } = await render(undefined, PAYMENT_ID.airtel);
    const sheet = el.querySelector('app-payment-sheet dialog')!;

    expect(sheet.querySelector('ui-copy-button')).not.toBeNull();
    expect(text(sheet.querySelector('.receipt .pending'))).toBe('Reçu en préparation');
    expect(sheet.querySelector('app-receipt-actions')).toBeNull();
  });

  it('ouvre une année précédente par l’URL', async () => {
    const { el, api } = await render(undefined, undefined, { year: YEAR.past });

    expect(api.payments).toHaveBeenCalledExactlyOnceWith(GRACE.childId, YEAR.past);
    expect([...el.querySelectorAll('ui-section-card h2')].map(text)).toEqual([
      'Janvier 2026',
      'Septembre 2025',
    ]);
  });

  it('dit une année passée sans versement, sans lien vers les frais', async () => {
    const { el } = await render([], undefined, { year: YEAR.past });

    expect(text(el.querySelector('ui-empty-period h2'))).toBe(
      'Aucun versement enregistré en 2025-2026.',
    );
    expect(el.querySelector('ui-empty-period a')).toBeNull();
  });

  it('confirme un reçu téléchargé faute de feuille de partage', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:recu');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const { el, fixture } = await render(undefined, PAYMENT_ID.cash);

    el.querySelector<HTMLButtonElement>('app-receipt-actions button')!.click();
    await settle();
    await fixture.whenStable();

    expect(text(el.querySelector('.saved'))).toMatch(/^Reçu n° .+ enregistré$/);
    vi.restoreAllMocks();
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
