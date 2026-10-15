import { TestBed } from '@angular/core/testing';
import { TermSelectionMemory, selectionParams, termQuery } from './term-selection';

describe('term-selection', () => {
  it('écrit la période et sa partie dans l’URL', () => {
    expect(selectionParams({ periodId: 't1', part: 'SECOND' })).toEqual({
      term: 't1',
      part: 'SECOND',
    });
    expect(selectionParams(null)).toEqual({});
  });

  it('ne demande une partie qu’avec sa période', () => {
    expect(termQuery('t1', 'SECOND')).toEqual({ periodId: 't1', part: 'SECOND' });
    expect(termQuery('t1')).toEqual({ periodId: 't1' });
    expect(termQuery(undefined, 'SECOND')).toEqual({});
  });

  it('se souvient de la sélection de chaque enfant pendant la session', () => {
    const memory = TestBed.inject(TermSelectionMemory);

    memory.remember('grace', { periodId: 't1', part: 'ALL' });

    expect(memory.recall('grace')).toEqual({ periodId: 't1', part: 'ALL' });
    expect(memory.recall('david')).toBeUndefined();
  });
});
