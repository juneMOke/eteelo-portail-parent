import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { bootstrapFixture, GRACE } from '../../../testing/bootstrap.fixture';
import { ParentApi } from '../api/parent-api';
import { Bootstrap } from './bootstrap.schema';
import { SessionStore } from './session.store';

describe('SessionStore', () => {
  const api = { bootstrap: vi.fn(), closeSession: vi.fn() };

  function setup() {
    TestBed.configureTestingModule({ providers: [{ provide: ParentApi, useValue: api }] });
    return TestBed.inject(SessionStore);
  }

  beforeEach(() => {
    api.bootstrap.mockReset();
    api.closeSession.mockReset();
  });

  it('charge le bootstrap et expose parent, école et enfants', async () => {
    api.bootstrap.mockReturnValue(of(bootstrapFixture()));
    const store = setup();

    await expect(store.ensureLoaded()).resolves.toBe('loaded');
    expect(store.parent()?.lastName).toBe('Kabila');
    expect(store.school()?.name).toBe('Complexe Scolaire La Fontaine');
    expect(store.academicYear()?.name).toBe('2026-2027');
    expect(store.childById(GRACE.childId)?.firstName).toBe('Grâce');
    expect(store.childById('inconnu')).toBeUndefined();
  });

  it("ne charge le bootstrap qu'une fois, même en appels concurrents", async () => {
    const response = new Subject<Bootstrap>();
    api.bootstrap.mockReturnValue(response);
    const store = setup();

    const first = store.ensureLoaded();
    const second = store.ensureLoaded();
    response.next(bootstrapFixture());
    response.complete();
    await Promise.all([first, second]);
    await store.ensureLoaded();

    expect(api.bootstrap).toHaveBeenCalledOnce();
  });

  it('passe en erreur si le chargement échoue, et peut réessayer', async () => {
    api.bootstrap.mockReturnValueOnce(throwError(() => new Error('réseau')));
    const store = setup();

    await expect(store.ensureLoaded()).resolves.toBe('error');
    expect(store.children()).toEqual([]);

    api.bootstrap.mockReturnValueOnce(of(bootstrapFixture()));
    await expect(store.ensureLoaded()).resolves.toBe('loaded');
  });

  it('vide la session à la déconnexion, même si le serveur échoue', async () => {
    api.bootstrap.mockReturnValue(of(bootstrapFixture()));
    api.closeSession.mockReturnValue(throwError(() => new Error('réseau')));
    const store = setup();
    await store.ensureLoaded();

    await expect(store.logout()).rejects.toThrow();
    expect(store.status()).toBe('idle');
    expect(store.parent()).toBeNull();
  });
});
