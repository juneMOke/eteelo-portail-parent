import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SessionStore } from '../session/session.store';
import { apiInterceptor } from './api.interceptor';

describe('apiInterceptor', () => {
  const reset = vi.fn();
  const navigateByUrl = vi.fn().mockResolvedValue(true);
  const router = { navigateByUrl, url: '/', currentNavigation: vi.fn(() => null as unknown) };

  function respond(url: string, status: number, body: { detailCode: string } | null = null): void {
    TestBed.inject(HttpClient)
      .get(url)
      .subscribe({ error: () => undefined });
    TestBed.inject(HttpTestingController).expectOne(url).flush(body, { status, statusText: '' });
  }

  beforeEach(() => {
    reset.mockClear();
    navigateByUrl.mockClear();
    router.url = '/';
    router.currentNavigation.mockReturnValue(null);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        { provide: SessionStore, useValue: { reset } },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('renvoie vers /login sur 401', () => {
    respond('/api/v1/parent/bootstrap', 401);

    expect(reset).toHaveBeenCalledOnce();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('garde la page d’enfant en cours d’ouverture pour après la connexion', () => {
    const requested = '/c/6a1d2c3b-4e5f-4a6b-8c7d-9e0f1a2b3c4d/messages?announcement=a1';
    router.currentNavigation.mockReturnValue({ extractedUrl: { toString: () => requested } });

    respond('/api/v1/parent/bootstrap', 401);

    expect(navigateByUrl).toHaveBeenCalledWith(
      `/login?returnPath=${encodeURIComponent(requested)}`,
    );
  });

  it("laisse les pages d'authentification gérer leur 401", () => {
    respond('/api/v1/parent/auth/me', 401);

    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it("renvoie au premier enfant quand le garde refuse l'enfant", () => {
    respond('/api/v1/parent/children/abc/timetable', 403, { detailCode: 'CHILD_NOT_VISIBLE' });

    expect(reset).toHaveBeenCalledOnce();
    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it("laisse à la page un autre 403 d'une route d'enfant (jeton CSRF refusé)", () => {
    respond('/api/v1/parent/children/abc/statement', 403);

    expect(reset).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('laisse passer les autres erreurs', () => {
    respond('/api/v1/parent/bootstrap', 500);

    expect(reset).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
