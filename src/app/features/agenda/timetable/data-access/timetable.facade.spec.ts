import { TestBed } from '@angular/core/testing';
import { NEVER, Observable, firstValueFrom, of } from 'rxjs';
import { ParentApi } from '../../../../core/api/parent-api';
import { TimetableWeek } from '../../../../core/api/timetable.contract';
import { settle } from '../../../../../testing/async';
import { GRACE } from '../../../../../testing/bootstrap.fixture';
import { timetableFixture } from '../../../../../testing/timetable.fixture';
import { TimetableFacade } from './timetable.facade';

describe('TimetableFacade', () => {
  function setup(serve: (week?: string) => TimetableWeek = (week) => timetableFixture(week)!) {
    const timetable = vi.fn((_: string, week?: string): Observable<TimetableWeek> =>
      of(serve(week)),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: ParentApi, useValue: { timetable } }],
    });
    return { facade: TestBed.inject(TimetableFacade), timetable };
  }

  it('lit la semaine demandée et note l’instant de la réception', async () => {
    const { facade, timetable } = setup();
    vi.spyOn(Date, 'now').mockReturnValue(1_000);

    const week = await firstValueFrom(facade.week({ childId: GRACE.childId, week: '2026-09-28' }));

    expect(week.weekStart).toBe('2026-09-28');
    expect(week.receivedAt).toBe(1_000);
    expect(timetable).toHaveBeenCalledWith(GRACE.childId, '2026-09-28');
    vi.restoreAllMocks();
  });

  it('ouvre sur la semaine du serveur tant qu’il reste des cours', async () => {
    const { facade, timetable } = setup();

    const week = await firstValueFrom(facade.week({ childId: GRACE.childId }));

    expect(week.weekStart).toBe('2026-09-21');
    expect(timetable).toHaveBeenCalledTimes(1);
  });

  it('lit la semaine suivante quand les cours de la semaine sont finis', async () => {
    const { facade, timetable } = setup((week) => ({
      ...timetableFixture(week)!,
      today: '2026-09-25',
      serverTime: '2026-09-25T11:00:00Z',
    }));

    const week = await firstValueFrom(facade.week({ childId: GRACE.childId }));

    expect(week.weekStart).toBe('2026-09-28');
    expect(timetable).toHaveBeenLastCalledWith(GRACE.childId, '2026-09-28');
  });

  it('montre la semaine déjà lue au retour, le temps que le serveur réponde', async () => {
    const { facade, timetable } = setup();
    const open = () =>
      TestBed.runInInjectionContext(() => facade.weekResource(() => ({ childId: GRACE.childId })));
    open();
    await settle();

    timetable.mockReturnValue(NEVER);
    const back = open();
    await settle();

    expect(back.value()?.weekStart).toBe('2026-09-21');
    expect(back.refreshing()).toBe(true);
  });
});
