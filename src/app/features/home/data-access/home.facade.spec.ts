import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { GRACE, bootstrapFixture } from '../../../../testing/bootstrap.fixture';
import { ParentApi } from '../../../core/api/parent-api';
import { NAV_GROUPS } from '../../../core/navigation/nav';
import { SessionStore } from '../../../core/session/session.store';
import { HomeFacade } from './home.facade';

describe('HomeFacade', () => {
  async function setup(relationshipType = GRACE.relationshipType) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ParentApi,
          useValue: { bootstrap: () => of(bootstrapFixture([{ ...GRACE, relationshipType }])) },
        },
      ],
    });
    await TestBed.inject(SessionStore).ensureLoaded();
    return TestBed.inject(HomeFacade);
  }

  it("salue le parent selon son lien avec l'enfant affiché", async () => {
    expect((await setup('MOTHER')).greeting(GRACE.childId)).toBe('Mbote, Mme Kabila');
  });

  it('se contente de « Mbote » pour un tuteur', async () => {
    expect((await setup('GUARDIAN')).greeting(GRACE.childId)).toBe('Mbote');
  });

  it("expose l'enfant et les cinq groupes du catalogue", async () => {
    const facade = await setup();

    expect(facade.child(GRACE.childId)?.firstName).toBe('Grâce');
    expect(facade.groups).toBe(NAV_GROUPS);
  });
});
