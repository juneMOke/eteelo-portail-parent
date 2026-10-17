import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { settle } from '../../../../testing/async';
import { GRACE, bootstrapFixture } from '../../../../testing/bootstrap.fixture';
import {
  ACADEMIC_YEARS,
  AIRTEL_PAYMENT,
  YEAR,
  paymentsFixture,
} from '../../../../testing/finance.fixture';
import { plainText as text } from '../../../../testing/text';
import { AcademicYear, Payment } from '../../../core/api/finance.contract';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';
import ReceiptsPage from './receipts.page';

registerLocaleData(localeFr);

describe('ReceiptsPage', () => {
  async function render(
    options: { year?: string; years?: readonly AcademicYear[]; payments?: Payment[] } = {},
  ) {
    const api = {
      payments: vi.fn((_: string, year?: string) => of(options.payments ?? paymentsFixture(year))),
      academicYears: vi.fn(() => of([...(options.years ?? ACADEMIC_YEARS)])),
      statement: vi.fn(() => of(new Blob(['%PDF']))),
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
    const fixture = TestBed.createComponent(ReceiptsPage);
    fixture.componentRef.setInput('childId', GRACE.childId);
    if (options.year) fixture.componentRef.setInput('year', options.year);
    await settle();
    await fixture.whenStable();
    return { fixture, api, el: fixture.nativeElement as HTMLElement };
  }

  const names = (el: HTMLElement) => [...el.querySelectorAll('app-receipt-row .name')].map(text);

  it('liste un reçu par ligne pour l’année en cours, en préparation compris', async () => {
    const { el } = await render();

    expect(text(el.querySelector('app-year-banner ui-filter-menu .value-label'))).toBe('2026-2027');
    expect(text(el.querySelector('ui-filter-menu .value-count'))).toBe('· 4 reçus');
    expect(text(el.querySelector('ui-section-card h2'))).toBe('Reçus de l’année');
    expect(text(el.querySelector('ui-section-card .count'))).toBe('4 reçus');
    expect(names(el)).toEqual([
      'Reçu en préparation',
      'Reçu n° ETL-RC-2627-001061',
      'Reçu n° ETL-RC-2627-001042',
      'Reçu n° ETL-RC-2627-001031',
    ]);
    const [pending, sealed] = el.querySelectorAll('app-receipt-row');
    expect(text(pending.querySelector('.recorded'))).toBe('Versement enregistré le 22/09');
    expect(pending.querySelector('app-receipt-actions')).toBeNull();
    expect(text(sealed.querySelector('.meta'))).toMatch(/^Sam\. 12 sept\. · Espèces · /);
    expect(text(sealed.querySelector('.amount'))).toBe('50 000 FC');
    expect(sealed.querySelector('app-receipt-actions a')?.getAttribute('aria-label')).toBe(
      'Ouvrir le reçu n° ETL-RC-2627-001061',
    );
    expect(text(el.querySelector('app-statement-footer .name'))).toBe(
      'Relevé de l’année 2026-2027',
    );
  });

  it('ouvre une année précédente par l’URL', async () => {
    const { el, api } = await render({ year: YEAR.past });

    expect(api.payments).toHaveBeenCalledExactlyOnceWith(GRACE.childId, YEAR.past);
    expect(text(el.querySelector('ui-section-card h2'))).toBe('Reçus 2025-2026');
    expect(names(el)).toEqual(['Reçu n° ETL-RC-2526-000912', 'Reçu n° ETL-RC-2526-000415']);
    expect(text(el.querySelector('app-statement-footer .name'))).toBe(
      'Relevé de l’année 2025-2026',
    );
  });

  it('change d’année par l’URL, sans paramètre pour l’année en cours', async () => {
    const { el, fixture } = await render({ year: YEAR.past });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    el.querySelector<HTMLButtonElement>('ui-filter-menu .trigger')!.click();
    await fixture.whenStable();
    el.querySelector<HTMLElement>('ui-filter-menu [role="option"]')!.click();

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { year: null }, replaceUrl: true }),
    );
  });

  it('n’offre pas de choix d’année sans année précédente : le libellé seul', async () => {
    const { el } = await render({ years: [ACADEMIC_YEARS[0]] });

    expect(el.querySelector('ui-filter-menu')).toBeNull();
    expect(text(el.querySelector('app-year-banner .single'))).toBe(
      'Année scolaire 2026-2027 · 4 reçus',
    );
  });

  it('télécharge le relevé de l’année affichée au geste, et le confirme', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:releve');
    URL.revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const { el, api, fixture } = await render({ year: YEAR.past });

    el.querySelector<HTMLButtonElement>('app-statement-footer button')!.click();
    await settle();
    await fixture.whenStable();

    expect(api.statement).toHaveBeenCalledExactlyOnceWith(GRACE.childId, YEAR.past);
    expect(click).toHaveBeenCalledOnce();
    expect(text(el.querySelector('.saved'))).toBe('Relevé de l’année 2025-2026 enregistré');
    vi.restoreAllMocks();
  });

  it('dit une année sans versement, sans relevé', async () => {
    const { el } = await render({ payments: [] });

    expect(text(el.querySelector('ui-empty-period h2'))).toBe(
      'Aucun versement enregistré cette année.',
    );
    expect(el.querySelector('app-statement-footer')).toBeNull();
  });

  it('montre un reçu encore en préparation, sans bouton', async () => {
    const { el } = await render({ payments: [AIRTEL_PAYMENT] });

    expect(names(el)).toEqual(['Reçu en préparation']);
    expect(el.querySelector('app-receipt-row button')).toBeNull();
    expect(el.querySelector('ui-empty-period')).toBeNull();
  });
});
