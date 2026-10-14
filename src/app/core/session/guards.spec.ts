import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { bootstrapFixture, GRACE } from '../../../testing/bootstrap.fixture';
import { ParentApi } from '../api/parent-api';
import { childGuard, firstChildGuard } from './child.guard';
import { sessionGuard } from './session.guard';
import { SessionStore } from './session.store';

describe('gardes de session', () => {
  const api = { bootstrap: vi.fn() };
  const state = {} as RouterStateSnapshot;

  function routeWith(childId: string | null): ActivatedRouteSnapshot {
    return { paramMap: convertToParamMap(childId ? { childId } : {}) } as ActivatedRouteSnapshot;
  }

  function run<T>(guard: () => T): T {
    return TestBed.runInInjectionContext(guard);
  }

  function url(result: unknown): string {
    return TestBed.inject(Router).serializeUrl(result as UrlTree);
  }

  beforeEach(() => {
    api.bootstrap.mockReset();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ParentApi, useValue: api }],
    });
  });

  it('sessionGuard laisse passer une session chargée', async () => {
    api.bootstrap.mockReturnValue(of(bootstrapFixture()));

    await expect(run(() => sessionGuard(routeWith(null), state))).resolves.toBe(true);
  });

  it('sessionGuard renvoie vers /login avec une erreur réseau', async () => {
    api.bootstrap.mockReturnValue(throwError(() => new Error('réseau')));

    expect(url(await run(() => sessionGuard(routeWith(null), state)))).toBe('/login?error=network');
  });

  describe('une fois la session chargée', () => {
    async function load(children = bootstrapFixture().children) {
      api.bootstrap.mockReturnValue(of(bootstrapFixture(children)));
      await TestBed.inject(SessionStore).ensureLoaded();
    }

    it('childGuard accepte un enfant du parent', async () => {
      await load();

      expect(run(() => childGuard(routeWith(GRACE.childId), state))).toBe(true);
    });

    it('childGuard renvoie un enfant inconnu au premier enfant', async () => {
      await load();

      expect(url(run(() => childGuard(routeWith('inconnu'), state)))).toBe(`/c/${GRACE.childId}`);
    });

    it('firstChildGuard mène à « aucun enfant rattaché » quand la liste est vide', async () => {
      await load([]);

      expect(url(run(() => firstChildGuard(routeWith(null), state)))).toBe('/no-children');
    });
  });
});
