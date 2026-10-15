import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
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
    const homework = vi.fn(() => of(homeworkListFixture()));
    const homeworkDetail = vi.fn(() => of(homeworkDetailFixture(MATHS_GRADED.evaluationId)));
    TestBed.configureTestingModule({
      providers: [{ provide: ParentApi, useValue: { homework, homeworkDetail } }],
    });
    return { facade: TestBed.inject(HomeworkFacade), homework, homeworkDetail };
  }

  it("relit la liste à chaque ouverture : rien n'est gardé d'une page à l'autre", async () => {
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
});
