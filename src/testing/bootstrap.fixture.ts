import { Bootstrap, Child } from '../app/core/session/bootstrap.schema';

/**
 * Données factices du bootstrap, partagées par les tests unitaires, le serveur factice
 * de développement (`npm run start:mock`) et les parcours Playwright.
 */
export const GRACE: Child = {
  childId: '6a1d2c3b-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
  firstName: 'Grâce',
  lastName: 'Mbala',
  surname: 'Nsimba',
  relationshipType: 'MOTHER',
  photoFingerprint: null,
  schoolLevelGroup: { id: '1f1e2d3c-4b5a-4c6d-8e7f-0a1b2c3d4e5f', name: 'Primaire' },
  schoolLevel: { id: '2f1e2d3c-4b5a-4c6d-8e7f-0a1b2c3d4e5f', name: '5e primaire' },
  classroom: { id: '3f1e2d3c-4b5a-4c6d-8e7f-0a1b2c3d4e5f', name: '5e B' },
};

export const DAVID: Child = {
  childId: '7b2e3d4c-5f6a-4b7c-9d8e-0f1a2b3c4d5e',
  firstName: 'David',
  lastName: 'Mbala',
  surname: 'Kalala',
  relationshipType: 'MOTHER',
  photoFingerprint: null,
  schoolLevelGroup: { id: '1f1e2d3c-4b5a-4c6d-8e7f-0a1b2c3d4e5f', name: 'Primaire' },
  schoolLevel: { id: '4f1e2d3c-4b5a-4c6d-8e7f-0a1b2c3d4e5f', name: '2e primaire' },
  classroom: null,
};

export function bootstrapFixture(children: Child[] = [GRACE, DAVID]): Bootstrap {
  return {
    parent: {
      parentId: '0b6f8c1e-3c1a-4a52-9a52-1f1e2d3c4b5a',
      firstName: 'Léonie',
      lastName: 'Kabila',
      surname: 'Mwamba',
      phoneNumber: '+243815632080',
      email: null,
    },
    school: {
      schoolId: '9c8b7a6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
      name: 'Complexe Scolaire La Fontaine',
      logoFingerprint: null,
    },
    academicYear: { id: '5f1e2d3c-4b5a-4c6d-8e7f-0a1b2c3d4e5f', name: '2026-2027' },
    children,
  };
}
