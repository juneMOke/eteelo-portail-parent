import { relativeWeek } from './relative-week';

describe('relativeWeek', () => {
  it('dit la position de la semaine, en entier et abrégée', () => {
    expect(relativeWeek(0)).toEqual({ long: 'cette semaine', short: 'cette sem.' });
    expect(relativeWeek(1).short).toBe('sem. prochaine');
    expect(relativeWeek(-1).long).toBe('semaine passée');
    expect(relativeWeek(-2)).toEqual({ long: 'il y a 2 semaines', short: 'il y a 2 sem.' });
  });
});
