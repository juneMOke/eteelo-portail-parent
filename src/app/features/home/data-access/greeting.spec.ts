import { greeting } from './greeting';

describe('greeting', () => {
  it('salue une mère et un père avec leur civilité', () => {
    expect(greeting('Kabila', 'MOTHER')).toBe('Mbote, Mme Kabila');
    expect(greeting('Kabila', 'FATHER')).toBe('Mbote, M. Kabila');
  });

  it('dit « Mbote » seul pour un autre lien ou un nom inconnu', () => {
    expect(greeting('Kabila', 'GUARDIAN')).toBe('Mbote');
    expect(greeting('  ', 'MOTHER')).toBe('Mbote');
    expect(greeting(null)).toBe('Mbote');
  });
});
