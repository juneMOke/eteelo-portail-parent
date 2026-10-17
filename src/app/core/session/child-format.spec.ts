import { DAVID, GRACE } from '../../../testing/bootstrap.fixture';
import { childFullName, childLabel, childName, childPhoto } from './child-format';

describe('mise en forme d’un enfant', () => {
  it('compose prénom et classe', () => {
    expect(childLabel(GRACE)).toBe('Grâce · 5e B');
  });

  it('se contente du prénom quand la classe manque', () => {
    expect(childLabel(DAVID)).toBe('David');
  });

  it('se rabat sur le nom quand le prénom manque', () => {
    expect(childName({ ...GRACE, firstName: '  ' })).toBe('Mbala');
    expect(childName({ ...GRACE, firstName: 'N/A' })).toBe('Mbala');
  });

  it('compose le nom complet, sans les parties absentes', () => {
    expect(childFullName(GRACE)).toBe('Grâce Mbala Nsimba');
    expect(childFullName({ ...GRACE, firstName: null, surname: ' ' })).toBe('Mbala');
    expect(childFullName({ ...GRACE, firstName: 'N/A', surname: '-' })).toBe('Mbala');
  });

  it("ne donne une photo que si l'enfant en a une", () => {
    expect(childPhoto(GRACE)).toBeNull();
    expect(childPhoto({ ...GRACE, photoFingerprint: 'abc' })).toBe(
      `/api/v1/parent/children/${GRACE.childId}/photo?v=abc`,
    );
  });
});
