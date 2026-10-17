import { TestBed } from '@angular/core/testing';
import { NEVER, Observable, firstValueFrom, of } from 'rxjs';
import { settle } from '../../../../../testing/async';
import { EvaluationList } from '../../../../core/api/assignments.contract';
import {
  CHEMISTRY_GRADED,
  evaluationDetailFixture,
  evaluationListFixture,
} from '../../../../../testing/assessments.fixture';
import { GRACE } from '../../../../../testing/bootstrap.fixture';
import { ParentApi } from '../../../../core/api/parent-api';
import { AssessmentsFacade } from './assessments.facade';

describe('AssessmentsFacade', () => {
  function setup() {
    const evaluations = vi.fn((): Observable<EvaluationList> => of(evaluationListFixture()));
    const evaluation = vi.fn(() => of(evaluationDetailFixture(CHEMISTRY_GRADED.evaluationId)));
    TestBed.configureTestingModule({
      providers: [{ provide: ParentApi, useValue: { evaluations, evaluation } }],
    });
    return { facade: TestBed.inject(AssessmentsFacade), evaluations, evaluation };
  }

  it('relit la liste à chaque ouverture', async () => {
    const { facade, evaluations } = setup();

    await firstValueFrom(facade.list(GRACE.childId));
    const list = await firstValueFrom(facade.list(GRACE.childId));

    expect(list.items).toHaveLength(7);
    expect(evaluations).toHaveBeenCalledTimes(2);
    expect(evaluations).toHaveBeenCalledWith(GRACE.childId);
  });

  it('relit toujours la fiche', async () => {
    const { facade, evaluation } = setup();

    await firstValueFrom(facade.detail(GRACE.childId, CHEMISTRY_GRADED.evaluationId));
    const detail = await firstValueFrom(
      facade.detail(GRACE.childId, CHEMISTRY_GRADED.evaluationId),
    );

    expect(detail.result?.classAverage).toBe(11.5);
    expect(evaluation).toHaveBeenCalledTimes(2);
    expect(evaluation).toHaveBeenCalledWith(GRACE.childId, CHEMISTRY_GRADED.evaluationId);
  });

  it('montre la liste déjà lue au retour, le temps que le serveur réponde', async () => {
    const { facade, evaluations } = setup();
    const open = () =>
      TestBed.runInInjectionContext(() => facade.listResource(() => GRACE.childId));
    open();
    await settle();

    evaluations.mockReturnValue(NEVER);
    const back = open();
    await settle();

    expect(back.value()).toBeDefined();
    expect(back.refreshing()).toBe(true);
    expect(evaluations).toHaveBeenCalledTimes(2);
  });
});
