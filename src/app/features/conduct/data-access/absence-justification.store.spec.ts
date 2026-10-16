import { HttpErrorResponse, HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { GRACE } from '../../../../testing/bootstrap.fixture';
import { AbsenceJustification, JustificationRequest } from '../../../core/api/conduct.contract';
import { ParentApi } from '../../../core/api/parent-api';
import { AbsenceJustificationStore, JustificationDraft } from './absence-justification.store';

describe('AbsenceJustificationStore', () => {
  const received: AbsenceJustification = {
    status: 'PENDING',
    reason: 'SICKNESS',
    submittedAt: '2026-10-02T09:00:00Z',
    decidedAt: null,
    decisionNote: null,
  };
  const draft: JustificationDraft = { reason: 'SICKNESS', note: '  Fièvre  ', file: null };
  const accepted = () => of(new HttpResponse({ status: 201, body: received }));

  function setup(...responses: (() => Observable<HttpEvent<AbsenceJustification>>)[]) {
    const justifyAbsence = vi.fn((_child: string, _date: string, _request: JustificationRequest) =>
      (responses.shift() ?? accepted)(),
    );
    TestBed.configureTestingModule({
      providers: [AbsenceJustificationStore, { provide: ParentApi, useValue: { justifyAbsence } }],
    });
    return { store: TestBed.inject(AbsenceJustificationStore), justifyAbsence };
  }

  const failing = (status: number, detailCode?: string) => () =>
    throwError(() => new HttpErrorResponse({ status, error: detailCode ? { detailCode } : null }));

  it('envoie la justification du jour et suit la progression', async () => {
    const events = new Subject<HttpEvent<AbsenceJustification>>();
    const { store, justifyAbsence } = setup(() => events);

    const result = store.submit(GRACE.childId, '2026-10-02', draft);
    await Promise.resolve();
    expect(store.sending()).toBe('2026-10-02');
    events.next({ type: HttpEventType.UploadProgress, loaded: 1, total: 2 });
    expect(store.progress()).toBe(0.5);
    events.next(new HttpResponse({ status: 201, body: received }));
    events.complete();

    expect(await result).toBe(true);
    expect(store.sending()).toBeNull();
    expect(store.failure()).toBeNull();
    expect(justifyAbsence).toHaveBeenCalledWith(
      GRACE.childId,
      '2026-10-02',
      expect.objectContaining({ reason: 'SICKNESS', note: 'Fièvre', file: null }),
    );
  });

  it('renvoie la même demande après une coupure, pour que l’école ne la reçoive qu’une fois', async () => {
    const { store, justifyAbsence } = setup(failing(0), accepted, accepted);

    expect(await store.submit(GRACE.childId, '2026-10-02', draft)).toBe(false);
    expect(store.failure()).toEqual({ message: 'L’envoi n’a pas abouti.', retryable: true });
    expect(await store.submit(GRACE.childId, '2026-10-02', draft)).toBe(true);
    await store.submit(GRACE.childId, '2026-10-02', draft);

    const ids = justifyAbsence.mock.calls.map(([, , request]) => request.id);
    expect(ids[0]).toBe(ids[1]);
    expect(ids[2]).not.toBe(ids[1]);
  });

  it('dit pourquoi l’école refuse, sans proposer de renvoyer', async () => {
    const { store } = setup(failing(422, 'JUSTIFICATION_CLOSED'));

    await store.submit(GRACE.childId, '2026-10-02', draft);

    expect(store.failure()).toEqual({
      message: 'Le délai de justification est passé.',
      retryable: false,
    });
    store.clearFailure();
    expect(store.failure()).toBeNull();
  });

  it('ignore un second envoi tant que le premier est en cours', async () => {
    const { store, justifyAbsence } = setup(() => new Subject());

    void store.submit(GRACE.childId, '2026-10-02', draft);
    expect(await store.submit(GRACE.childId, '2026-10-05', draft)).toBe(false);
    expect(justifyAbsence).toHaveBeenCalledOnce();
  });
});
