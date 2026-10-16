import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TermMemory } from '../../../core/navigation/term-memory';
import { injectDisciplineTerm } from './discipline-term';

describe('injectDisciplineTerm', () => {
  function setup() {
    const term = signal<string | undefined>(undefined);
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const control = TestBed.runInInjectionContext(() =>
      injectDisciplineTerm({ childId: () => 'grace', term }),
    );
    return { control, term };
  }

  it('lit le trimestre de l’URL, sinon celui choisi pendant la session', () => {
    const { control, term } = setup();
    TestBed.inject(TermMemory).remember('grace', { periodId: 't1', part: 'SECOND' });
    expect(control.periodId()).toBe('t1');

    term.set('t2');
    expect(control.periodId()).toBe('t2');
  });

  it('laisse le serveur choisir le trimestre en cours, faute de choix', () => {
    expect(setup().control.periodId()).toBeUndefined();
  });

  it('retient le choix et l’écrit dans l’URL', () => {
    const { control } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    control.select('t3');

    expect(TestBed.inject(TermMemory).recall('grace')).toEqual({ periodId: 't3', part: 'ALL' });
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { term: 't3', case: null },
        replaceUrl: true,
      }),
    );
  });
});
