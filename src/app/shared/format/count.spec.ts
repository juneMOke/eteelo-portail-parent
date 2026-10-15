import { countLabel } from './count';

describe('countLabel', () => {
  it('dit aucun, un ou plusieurs éléments', () => {
    expect(countLabel(0, 'épreuve', 'épreuves', 'Aucune épreuve')).toBe('Aucune épreuve');
    expect(countLabel(1, 'épreuve', 'épreuves', 'Aucune épreuve')).toBe('1 épreuve');
    expect(countLabel(3, 'épreuve', 'épreuves', 'Aucune épreuve')).toBe('3 épreuves');
  });
});
