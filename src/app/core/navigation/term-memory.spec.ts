import { TestBed } from '@angular/core/testing';
import { TermMemory } from './term-memory';

describe('TermMemory', () => {
  it('se souvient du choix de chaque enfant pendant la session', () => {
    const memory = TestBed.inject(TermMemory);

    memory.remember('grace', { periodId: 't1', part: 'SECOND' });

    expect(memory.recall('grace')).toEqual({ periodId: 't1', part: 'SECOND' });
    expect(memory.recall('david')).toBeUndefined();
  });

  it('garde la partie choisie quand une page sans partie retient la même période', () => {
    const memory = TestBed.inject(TermMemory);

    memory.remember('grace', { periodId: 't1', part: 'SECOND' });
    memory.rememberPeriod('grace', 't1');
    expect(memory.recall('grace')).toEqual({ periodId: 't1', part: 'SECOND' });

    memory.rememberPeriod('grace', 't2');
    expect(memory.recall('grace')).toEqual({ periodId: 't2', part: 'ALL' });
  });
});
