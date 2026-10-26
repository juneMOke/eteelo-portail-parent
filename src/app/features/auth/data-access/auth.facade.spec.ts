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
    openSession: vi.fn(() => of({} as { returnPath?: string | null })),
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

  describe('adresse de retour', () => {
    const page = '/c/6a1d2c3b-4e5f-4a6b-8c7d-9e0f1a2b3c4d/messages?announcement=a1';

    beforeEach(() => (token = 'abc'));

    it('la transmet avec la demande de lien, si c’est une page d’enfant', async () => {
      const auth = TestBed.inject(AuthFacade);
      await auth.requestLink('+243815632080', page);
      await auth.requestLink('+243815632080', 'https://evil.example/');

      expect(api.requestMagicLink).toHaveBeenNthCalledWith(1, {
        phoneNumber: '+243815632080',
        returnPath: page,
      });
      expect(api.requestMagicLink).toHaveBeenNthCalledWith(2, { phoneNumber: '+243815632080' });
    });

    it('rend celle de l’ouverture de session, revérifiée', async () => {
      const auth = TestBed.inject(AuthFacade);
      api.openSession.mockReturnValueOnce(of({ returnPath: page }));
      api.openSession.mockReturnValueOnce(of({ returnPath: '//evil.example' }));
      api.openSession.mockReturnValueOnce(of({ returnPath: null }));

      await expect(auth.openSession('j1')).resolves.toBe(page);
      await expect(auth.openSession('j2')).resolves.toBeNull();
      await expect(auth.openSession('j3')).resolves.toBeNull();
    });
  });
});
