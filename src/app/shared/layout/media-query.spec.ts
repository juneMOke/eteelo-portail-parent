import { TestBed } from '@angular/core/testing';
import { mediaQuery } from './media-query';

describe('mediaQuery', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('suit les changements de la media query', () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: (_: string, fn: typeof listener) => (listener = fn),
      removeEventListener: vi.fn(),
    }));
    const wide = TestBed.runInInjectionContext(() => mediaQuery('(min-width: 905px)'));

    expect(wide()).toBe(false);
    listener?.({ matches: true } as MediaQueryListEvent);
    expect(wide()).toBe(true);
  });

  it('répond faux sans matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(TestBed.runInInjectionContext(() => mediaQuery('(min-width: 905px)'))()).toBe(false);
  });
});
