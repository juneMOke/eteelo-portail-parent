import { TestBed } from '@angular/core/testing';
import { NEVER, Observable, firstValueFrom, of } from 'rxjs';
import { HomeworkList } from '../../../../core/api/assignments.contract';
import { settle } from '../../../../../testing/async';
import { GRACE } from '../../../../../testing/bootstrap.fixture';
import {
  MATHS_GRADED,
  homeworkDetailFixture,
  homeworkListFixture,
} from '../../../../../testing/homework.fixture';
import { ParentApi } from '../../../../core/api/parent-api';
import { HomeworkFacade } from './homework.facade';

describe('HomeworkFacade', () => {
  function setup() {
    const homework = vi.fn((): Observable<HomeworkList> => of(homeworkListFixture()));
    const homeworkDetail = vi.fn(() => of(homeworkDetailFixture(MATHS_GRADED.evaluationId)));
    TestBed.configureTestingModule({
      providers: [{ provide: ParentApi, useValue: { homework, homeworkDetail } }],
    });
    return { facade: TestBed.inject(HomeworkFacade), homework, homeworkDetail };
  }

  it('relit la liste à chaque ouverture', async () => {
    const { facade, homework } = setup();

    await firstValueFrom(facade.list(GRACE.childId));
    const list = await firstValueFrom(facade.list(GRACE.childId));

    expect(list.items).toHaveLength(6);
    expect(homework).toHaveBeenCalledTimes(2);
    expect(homework).toHaveBeenCalledWith(GRACE.childId);
  });

  it('relit toujours la fiche', async () => {
    const { facade, homeworkDetail } = setup();

    await firstValueFrom(facade.detail(GRACE.childId, MATHS_GRADED.evaluationId));
    const detail = await firstValueFrom(facade.detail(GRACE.childId, MATHS_GRADED.evaluationId));

    expect(detail.result?.classAverage).toBe(12.25);
    expect(homeworkDetail).toHaveBeenCalledTimes(2);
    expect(homeworkDetail).toHaveBeenCalledWith(GRACE.childId, MATHS_GRADED.evaluationId);
  });

  it('montre la liste déjà lue au retour, le temps que le serveur réponde', async () => {
    const { facade, homework } = setup();
    const open = () =>
      TestBed.runInInjectionContext(() => facade.listResource(() => GRACE.childId));
    open();
    await settle();

    homework.mockReturnValue(NEVER);
    const back = open();
    await settle();

    expect(back.value()?.items).toHaveLength(6);
    expect(back.refreshing()).toBe(true);
    expect(homework).toHaveBeenCalledTimes(2);
  });
});
