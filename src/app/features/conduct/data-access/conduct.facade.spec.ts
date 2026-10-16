import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { settle } from '../../../../testing/async';
import { attendanceFixture } from '../../../../testing/attendance.fixture';
import { GRACE, bootstrapFixture } from '../../../../testing/bootstrap.fixture';
import { disciplineFixture } from '../../../../testing/discipline.fixture';
import { TERM } from '../../../../testing/grades-terms.fixture';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';
import { ConductFacade } from './conduct.facade';

describe('ConductFacade', () => {
  function setup() {
    const api = {
      attendance: vi.fn(() => of(attendanceFixture())),
      discipline: vi.fn((_: string, periodId?: string) => of(disciplineFixture(periodId))),
      bootstrap: vi.fn(() => of(bootstrapFixture())),
    };
    TestBed.configureTestingModule({ providers: [{ provide: ParentApi, useValue: api }] });
    return { api, facade: TestBed.inject(ConductFacade) };
  }

  it('lit toute l’année de présence de l’enfant en un appel', async () => {
    const { api, facade } = setup();

    const resource = TestBed.runInInjectionContext(() =>
      facade.attendanceResource(() => GRACE.childId),
    );
    TestBed.inject(ApplicationRef).tick();
    await settle();

    expect(api.attendance).toHaveBeenCalledExactlyOnceWith(GRACE.childId);
    expect(resource.value()?.to).toBe('2026-10-06');
  });

  it('lit le résumé de la semaine, borné à ses jours', async () => {
    const { api, facade } = setup();

    TestBed.runInInjectionContext(() =>
      facade.attendanceWeekResource(() => ({
        childId: GRACE.childId,
        from: '2026-09-14',
        to: '2026-09-20',
      })),
    );
    TestBed.inject(ApplicationRef).tick();
    await settle();

    expect(api.attendance).toHaveBeenCalledExactlyOnceWith(GRACE.childId, {
      from: '2026-09-14',
      to: '2026-09-20',
    });
  });

  it('lit le trimestre demandé, ou celui en cours', async () => {
    const { api, facade } = setup();

    const resource = TestBed.runInInjectionContext(() =>
      facade.disciplineResource(() => ({ childId: GRACE.childId, periodId: TERM.second })),
    );
    TestBed.inject(ApplicationRef).tick();
    await settle();

    expect(api.discipline).toHaveBeenCalledWith(GRACE.childId, TERM.second);
    expect(resource.value()?.cases).toEqual([]);
  });

  it('donne le téléphone du secrétariat, lu dans la session', async () => {
    const { facade } = setup();

    expect(facade.schoolPhone()).toBeNull();
    await TestBed.inject(SessionStore).ensureLoaded();
    expect(facade.schoolPhone()).toBe('+243998877665');
  });
});
