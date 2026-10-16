import { greetingName } from './greeting';

const LEONIE = { firstName: 'Léonie', lastName: 'Kabila', surname: 'Mwamba' };

describe('greetingName', () => {
  it('nomme une mère et un père par leur civilité et leur nom complet', () => {
    expect(greetingName(LEONIE, 'MOTHER')).toBe('Mme Léonie Kabila Mwamba');
    expect(greetingName(LEONIE, 'FATHER')).toBe('M. Léonie Kabila Mwamba');
  });

  it('nomme un autre lien par son nom complet, sans civilité', () => {
    expect(greetingName(LEONIE, 'GUARDIAN')).toBe('Léonie Kabila Mwamba');
  });

  it('omet le prénom et le postnom absents', () => {
    expect(greetingName({ firstName: null, lastName: 'Kabila', surname: ' ' }, 'MOTHER')).toBe(
      'Mme Kabila',
    );
  });

  it('ne nomme personne sans nom', () => {
    expect(greetingName({ ...LEONIE, lastName: '  ' }, 'MOTHER')).toBeNull();
    expect(greetingName(undefined)).toBeNull();
  });
});
