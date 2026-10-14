import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SessionStore } from '../session/session.store';
import { apiInterceptor } from './api.interceptor';

describe('apiInterceptor', () => {
  const reset = vi.fn();
  const navigateByUrl = vi.fn().mockResolvedValue(true);

  function respond(url: string, status: number): void {
    TestBed.inject(HttpClient)
      .get(url)
      .subscribe({ error: () => undefined });
    TestBed.inject(HttpTestingController).expectOne(url).flush(null, { status, statusText: '' });
  }

  beforeEach(() => {
    reset.mockClear();
    navigateByUrl.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        { provide: SessionStore, useValue: { reset } },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
  });

  it('renvoie vers /login sur 401', () => {
    respond('/api/v1/parent/bootstrap', 401);

    expect(reset).toHaveBeenCalledOnce();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it("laisse les pages d'authentification gérer leur 401", () => {
    respond('/api/v1/parent/auth/me', 401);

    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it("renvoie au premier enfant sur 403 d'une route d'enfant", () => {
    respond('/api/v1/parent/children/abc/timetable', 403);

    expect(reset).toHaveBeenCalledOnce();
    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('laisse passer les autres erreurs', () => {
    respond('/api/v1/parent/bootstrap', 500);

    expect(reset).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
