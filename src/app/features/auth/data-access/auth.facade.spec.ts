import { HttpXsrfTokenExtractor } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';
import { AuthFacade } from './auth.facade';

describe('AuthFacade', () => {
  const api = {
    currentHolder: vi.fn(),
    requestMagicLink: vi.fn(() => of(undefined)),
    openSession: vi.fn(() => of({})),
  };
  const session = { reset: vi.fn() };
  let token: string | null;

  beforeEach(() => {
    vi.clearAllMocks();
    api.currentHolder.mockReturnValue(throwError(() => new Error('401')));
    token = null;
    TestBed.configureTestingModule({
      providers: [
        { provide: ParentApi, useValue: api },
        { provide: SessionStore, useValue: session },
        { provide: HttpXsrfTokenExtractor, useValue: { getToken: () => token } },
      ],
    });
  });

  it('fait poser le jeton CSRF avant la demande de lien', async () => {
    await TestBed.inject(AuthFacade).requestLink('+243815632080');

    expect(api.currentHolder).toHaveBeenCalledOnce();
    expect(api.requestMagicLink).toHaveBeenCalledWith({ phoneNumber: '+243815632080' });
  });

  it("n'appelle pas /auth/me quand le jeton est déjà là", async () => {
    token = 'abc';
    await TestBed.inject(AuthFacade).requestLink('+243815632080');

    expect(api.currentHolder).not.toHaveBeenCalled();
  });

  it('ouvre la session et réinitialise le bootstrap', async () => {
    token = 'abc';
    await TestBed.inject(AuthFacade).openSession('jeton-du-lien');

    expect(api.openSession).toHaveBeenCalledWith({ token: 'jeton-du-lien' });
    expect(session.reset).toHaveBeenCalledOnce();
  });
});
