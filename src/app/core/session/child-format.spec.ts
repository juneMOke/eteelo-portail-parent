import { DAVID, GRACE } from '../../../testing/bootstrap.fixture';
import { childLabel, childName, childPhoto } from './child-format';

describe('mise en forme d’un enfant', () => {
  it('compose prénom et classe', () => {
    expect(childLabel(GRACE)).toBe('Grâce · 5e B');
  });

  it('se contente du prénom quand la classe manque', () => {
    expect(childLabel(DAVID)).toBe('David');
  });

  it('se rabat sur le nom quand le prénom manque', () => {
    expect(childName({ ...GRACE, firstName: '  ' })).toBe('Mbala');
  });

  it("ne donne une photo que si l'enfant en a une", () => {
    expect(childPhoto(GRACE)).toBeNull();
    expect(childPhoto({ ...GRACE, photoFingerprint: 'abc' })).toBe(
      `/api/v1/parent/children/${GRACE.childId}/photo`,
    );
  });
});
