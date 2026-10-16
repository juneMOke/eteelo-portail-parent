import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { settle } from '../../../../testing/async';
import { GRACE, bootstrapFixture } from '../../../../testing/bootstrap.fixture';
import {
  ACADEMIC_YEARS,
  PAYMENT_ID,
  YEAR,
  feesFixture,
  paymentsFixture,
} from '../../../../testing/finance.fixture';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';
import { FinanceFacade } from './finance.facade';

describe('FinanceFacade', () => {
  function setup() {
    const api = {
      fees: vi.fn(() => of(feesFixture())),
      payments: vi.fn((_: string, year?: string) => of(paymentsFixture(year))),
      academicYears: vi.fn(() => of([...ACADEMIC_YEARS])),
      bootstrap: vi.fn(() => of(bootstrapFixture())),
    };
    TestBed.configureTestingModule({ providers: [{ provide: ParentApi, useValue: api }] });
    return { api, facade: TestBed.inject(FinanceFacade) };
  }

  async function flush(): Promise<void> {
    TestBed.inject(ApplicationRef).tick();
    await settle();
  }

  it('lit les frais de l’année courante de l’enfant', async () => {
    const { api, facade } = setup();

    const resource = TestBed.runInInjectionContext(() => facade.feesResource(() => GRACE.childId));
    await flush();

    expect(api.fees).toHaveBeenCalledExactlyOnceWith(GRACE.childId);
    expect(resource.value()?.fees).toHaveLength(4);
  });

  it('lit les versements de l’année demandée, ou de l’année courante', async () => {
    const { api, facade } = setup();

    const resource = TestBed.runInInjectionContext(() =>
      facade.paymentsResource(() => ({ childId: GRACE.childId, academicYearId: YEAR.past })),
    );
    await flush();

    expect(api.payments).toHaveBeenCalledWith(GRACE.childId, YEAR.past);
    expect(resource.value()).toHaveLength(2);
  });

  it('lit les années de l’enfant', async () => {
    const { api, facade } = setup();

    const resource = TestBed.runInInjectionContext(() =>
      facade.academicYearsResource(() => GRACE.childId),
    );
    await flush();

    expect(api.academicYears).toHaveBeenCalledWith(GRACE.childId);
    expect(resource.value()?.map((year) => year.label)).toEqual(['2026-2027', '2025-2026']);
  });

  it('donne l’année courante, le secrétariat et le lien d’un reçu', async () => {
    const { facade } = setup();

    await TestBed.inject(SessionStore).ensureLoaded();

    expect(facade.currentYearLabel()).toBe('2026-2027');
    expect(facade.schoolPhone()).toBe('+243998877665');
    expect(facade.receiptHref(GRACE.childId, PAYMENT_ID.cash)).toBe(
      `/api/v1/parent/children/${GRACE.childId}/payments/${PAYMENT_ID.cash}/receipt`,
    );
  });
});
