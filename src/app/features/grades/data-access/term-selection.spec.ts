import { TestBed } from '@angular/core/testing';
import { TermSelectionMemory, selectionParams, termQuery } from './term-selection';

describe('term-selection', () => {
  it('écrit la sélection dans l’URL, tout le trimestre sans période', () => {
    expect(selectionParams({ termId: 't1', periodId: 'p2' })).toEqual({ term: 't1', period: 'p2' });
    expect(selectionParams({ termId: 't1', periodId: null })).toEqual({ term: 't1', period: null });
  });

  it('ne demande une période qu’avec son trimestre', () => {
    expect(termQuery('t1', 'p2')).toEqual({ termId: 't1', periodId: 'p2' });
    expect(termQuery('t1')).toEqual({ termId: 't1' });
    expect(termQuery(undefined, 'p2')).toEqual({});
  });

  it('se souvient de la sélection de chaque enfant pendant la session', () => {
    const memory = TestBed.inject(TermSelectionMemory);

    memory.remember('grace', { termId: 't1', periodId: null });

    expect(memory.recall('grace')).toEqual({ termId: 't1' });
    expect(memory.recall('david')).toBeUndefined();
  });
});
