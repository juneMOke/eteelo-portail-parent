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

  it('liste un reçu par ligne pour l’année en cours, sans les reçus en préparation', async () => {
    const { el } = await render();

    expect(text(el.querySelector('ui-filter-menu .value-label'))).toBe('2026-2027');
    expect(text(el.querySelector('ui-filter-menu .value-count'))).toBe('· 3 reçus');
    expect(text(el.querySelector('ui-section-card .count'))).toBe('3 reçus');
    expect(names(el)).toEqual([
      'Reçu n° ETL-RC-2627-001061',
      'Reçu n° ETL-RC-2627-001042',
      'Reçu n° ETL-RC-2627-001031',
    ]);
    expect(text(el.querySelector('app-receipt-row .meta'))).toBe('Sam. 12 sept. · Espèces');
    expect(text(el.querySelector('app-receipt-row .amount'))).toBe('50 000 FC');
    expect(text(el.querySelector('app-statement-footer .name'))).toBe(
      'Relevé de l’année 2026-2027',
    );
  });

  it('ouvre une année précédente par l’URL', async () => {
    const { el, api } = await render({ year: YEAR.past });

    expect(api.payments).toHaveBeenCalledExactlyOnceWith(GRACE.childId, YEAR.past);
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

  it('n’offre pas de choix d’année sans année précédente', async () => {
    const { el } = await render({ years: [ACADEMIC_YEARS[0]] });

    expect(el.querySelector('ui-pill-group')).toBeNull();
    expect(el.querySelector('ui-filter-menu')).toBeNull();
  });

  it('génère le relevé de l’année affichée au geste', async () => {
    const tab = { location: { href: '' }, close: vi.fn() };
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    URL.createObjectURL = vi.fn(() => 'blob:releve');
    const { el, api } = await render({ year: YEAR.past });

    el.querySelector<HTMLButtonElement>('app-statement-footer button')!.click();
    await settle();

    expect(api.statement).toHaveBeenCalledExactlyOnceWith(GRACE.childId, YEAR.past);
    expect(tab.location.href).toBe('blob:releve');
    vi.restoreAllMocks();
  });

  it('dit une année sans versement, sans relevé', async () => {
    const { el } = await render({ payments: [] });

    expect(text(el.querySelector('ui-empty-period h2'))).toBe(
      'Aucun versement enregistré cette année.',
    );
    expect(el.querySelector('app-statement-footer')).toBeNull();
  });

  it('dit des reçus encore en préparation', async () => {
    const { el } = await render({ payments: [AIRTEL_PAYMENT] });

    expect(text(el.querySelector('ui-empty-period h2'))).toBe(
      'Les reçus de vos versements sont en préparation.',
    );
    expect(el.querySelector('ui-empty-period a')).toBeNull();
  });
});
