import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import {
  CHEMISTRY_GRADED,
  evaluationDetailFixture,
  evaluationListFixture,
} from '../../../../../testing/assessments.fixture';
import { GRACE } from '../../../../../testing/bootstrap.fixture';
import { ParentApi } from '../../../../core/api/parent-api';
import { AssessmentsFacade, isNotFound } from './assessments.facade';

describe('AssessmentsFacade', () => {
  function setup() {
    const evaluations = vi.fn(() => of(evaluationListFixture()));
    const evaluation = vi.fn(() => of(evaluationDetailFixture(CHEMISTRY_GRADED.evaluationId)));
    TestBed.configureTestingModule({
      providers: [{ provide: ParentApi, useValue: { evaluations, evaluation } }],
    });
    return { facade: TestBed.inject(AssessmentsFacade), evaluations, evaluation };
  }

  it("relit la liste à chaque ouverture : rien n'est gardé d'une page à l'autre", async () => {
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

  it('reconnaît une fiche introuvable, enveloppée ou non', () => {
    const notFound = new HttpErrorResponse({ status: 404 });

    expect(isNotFound(notFound)).toBe(true);
    expect(isNotFound(new Error('ressource', { cause: notFound }))).toBe(true);
    expect(isNotFound(new HttpErrorResponse({ status: 500 }))).toBe(false);
    expect(isNotFound(undefined)).toBe(false);
  });
});
