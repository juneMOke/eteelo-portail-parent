import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { GRACE } from '../../../../testing/bootstrap.fixture';
import { PAYMENT_ID, YEAR } from '../../../../testing/finance.fixture';
import { ParentApi } from '../../../core/api/parent-api';
import { FinanceDocumentsStore, receiptKey, statementKey } from './finance-documents.store';

describe('FinanceDocumentsStore', () => {
  const pdf = new Blob(['%PDF'], { type: 'application/pdf' });

  function setup(statement: () => Observable<Blob> = () => of(pdf)) {
    const api = { receipt: vi.fn(() => of(pdf)), statement: vi.fn(statement) };
    TestBed.configureTestingModule({
      providers: [FinanceDocumentsStore, { provide: ParentApi, useValue: api }],
    });
    return { api, store: TestBed.inject(FinanceDocumentsStore) };
  }

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:document');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    Object.assign(navigator, { canShare: () => true, share: vi.fn(async () => undefined) });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'canShare');
    Reflect.deleteProperty(navigator, 'share');
  });

  it('partage le reçu scellé sous son numéro', async () => {
    const { api, store } = setup();

    const outcome = await store.shareReceipt(GRACE.childId, PAYMENT_ID.cash, 'ETL-RC-2627-001042');

    expect(outcome).toBe('shared');
    expect(api.receipt).toHaveBeenCalledWith(GRACE.childId, PAYMENT_ID.cash);
    const [{ files }] = vi.mocked(navigator.share).mock.calls[0] as [{ files: File[] }];
    expect(files[0].name).toBe('ETL-RC-2627-001042.pdf');
    expect(store.pending()).toBeNull();
  });

  it('télécharge un reçu quand le navigateur ne sait pas le partager', async () => {
    const { store } = setup();
    Object.assign(navigator, { canShare: () => false });

    const outcome = await store.shareReceipt(GRACE.childId, PAYMENT_ID.cash, 'ETL-RC-2627-001042');

    expect(outcome).toBe('downloaded');
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
  });

  it('ne régénère pas le relevé déjà téléchargé pendant la visite', async () => {
    const { api, store } = setup();

    expect(await store.downloadStatement(GRACE.childId, 'Releve-2025-2026.pdf', YEAR.past)).toBe(
      true,
    );
    await store.downloadStatement(GRACE.childId, 'Releve-2025-2026.pdf', YEAR.past);

    expect(api.statement).toHaveBeenCalledExactlyOnceWith(GRACE.childId, YEAR.past);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(2);
  });

  it('dit le plafond atteint', async () => {
    const { store } = setup(() => throwError(() => new HttpErrorResponse({ status: 429 })));

    expect(await store.downloadStatement(GRACE.childId, 'Releve-2026-2027.pdf')).toBe(false);

    expect(store.failure()).toEqual({
      key: statementKey(undefined),
      message: 'Trop de demandes en peu de temps. Réessayez dans quelques minutes.',
    });
  });

  it('dit un document qui ne vient pas, et l’efface au geste suivant', async () => {
    const { api, store } = setup();
    api.receipt.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 0 })));

    await store.shareReceipt(GRACE.childId, PAYMENT_ID.cash, 'ETL-RC-2627-001042');
    expect(store.failure()?.key).toBe(receiptKey(PAYMENT_ID.cash));
    expect(store.failure()?.message).toContain('Vérifiez votre connexion');

    await store.shareReceipt(GRACE.childId, PAYMENT_ID.cash, 'ETL-RC-2627-001042');
    expect(store.failure()).toBeNull();
  });
});
