import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpResponse,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject, throwError } from 'rxjs';
import { GRACE } from '../../../../../testing/bootstrap.fixture';
import { PHYSICS_DUE, submittedHomeworkFixture } from '../../../../../testing/homework.fixture';
import { HomeworkDetail } from '../../../../core/api/assignments.contract';
import { ParentApi } from '../../../../core/api/parent-api';
import { HomeworkSubmissionStore } from './homework-submission.store';

describe('HomeworkSubmissionStore', () => {
  const copy = new File(['%PDF'], 'copie.pdf', { type: 'application/pdf' });
  const submitted = submittedHomeworkFixture(PHYSICS_DUE.evaluationId, [
    { name: 'copie.pdf', type: 'application/pdf', size: 4 },
  ])!;

  function setup(response: () => Observable<HttpEvent<HomeworkDetail>>) {
    const submitHomework = vi.fn(response);
    TestBed.configureTestingModule({
      providers: [HomeworkSubmissionStore, { provide: ParentApi, useValue: { submitHomework } }],
    });
    return { store: TestBed.inject(HomeworkSubmissionStore), submitHomework };
  }

  const refusal = (status: number, detailCode?: string) => () =>
    throwError(() => new HttpErrorResponse({ status, error: detailCode ? { detailCode } : null }));

  it('suit la progression puis rend la fiche relue par le serveur', async () => {
    const events = new Subject<HttpEvent<HomeworkDetail>>();
    const { store, submitHomework } = setup(() => events);

    const result = store.submit(GRACE.childId, PHYSICS_DUE.evaluationId, [copy]);
    expect(store.progress()).toBe(0);
    events.next({ type: HttpEventType.UploadProgress, loaded: 3, total: 4 });
    expect(store.progress()).toBe(0.75);
    events.next(new HttpResponse({ status: 201, body: submitted }));
    events.complete();

    expect(await result).toEqual(submitted);
    expect(store.progress()).toBeNull();
    expect(store.failure()).toBeNull();
    expect(submitHomework).toHaveBeenCalledWith(GRACE.childId, PHYSICS_DUE.evaluationId, [copy]);
  });

  it('ignore un second envoi tant que le premier est en cours', async () => {
    const events = new Subject<HttpEvent<HomeworkDetail>>();
    const { store, submitHomework } = setup(() => events);

    void store.submit(GRACE.childId, PHYSICS_DUE.evaluationId, [copy]);
    expect(await store.submit(GRACE.childId, PHYSICS_DUE.evaluationId, [copy])).toBeNull();
    expect(submitHomework).toHaveBeenCalledOnce();
  });

  it('propose de réessayer un envoi interrompu', async () => {
    const { store } = setup(refusal(0));

    expect(await store.submit(GRACE.childId, PHYSICS_DUE.evaluationId, [copy])).toBeNull();
    expect(store.progress()).toBeNull();
    expect(store.failure()).toEqual({ message: 'L’envoi n’a pas abouti.', retryable: true });
  });

  it('dit le refus de l’école, sans proposer de renvoyer le même fichier', async () => {
    const { store } = setup(refusal(422, 'SUBMISSION_CLOSED'));

    await store.submit(GRACE.childId, PHYSICS_DUE.evaluationId, [copy]);

    expect(store.failure()).toEqual({
      message: 'Le dépôt est fermé pour ce devoir.',
      retryable: false,
    });
  });

  it('reste neutre sur une cause de refus inconnue', async () => {
    const { store } = setup(refusal(422, 'NOUVELLE_CAUSE'));

    await store.submit(GRACE.childId, PHYSICS_DUE.evaluationId, [copy]);

    expect(store.failure()?.message).toBe('L’école a refusé ce dépôt.');
  });

  it('fait patienter quand le plafond de dépôts est atteint', async () => {
    const { store } = setup(refusal(429));

    await store.submit(GRACE.childId, PHYSICS_DUE.evaluationId, [copy]);

    expect(store.failure()?.retryable).toBe(true);
    expect(store.failure()?.message).toContain('Réessayez dans un moment');
  });

  it('oublie l’échec quand le parent change de fichier', async () => {
    const { store } = setup(refusal(0));
    await store.submit(GRACE.childId, PHYSICS_DUE.evaluationId, [copy]);

    store.clearFailure();

    expect(store.failure()).toBeNull();
  });
});
