import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { announcementsFixture } from '../../../../testing/announcements.fixture';
import { settle } from '../../../../testing/async';
import { GRACE, bootstrapFixture } from '../../../../testing/bootstrap.fixture';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';
import { MessagesFacade } from './messages.facade';

describe('MessagesFacade', () => {
  async function setup(bootstrap = bootstrapFixture()) {
    const api = {
      announcements: vi.fn(() => of(announcementsFixture(announcementsFixture().items.slice(1)))),
      bootstrap: vi.fn(() => of(bootstrap)),
    };
    TestBed.configureTestingModule({ providers: [{ provide: ParentApi, useValue: api }] });
    const session = TestBed.inject(SessionStore);
    await session.ensureLoaded();
    return { api, session, facade: TestBed.inject(MessagesFacade) };
  }

  it('lit les annonces de l’enfant et met son badge au compte du serveur', async () => {
    const { api, session, facade } = await setup();

    const resource = TestBed.runInInjectionContext(() =>
      facade.announcementsResource(() => GRACE.childId),
    );
    TestBed.inject(ApplicationRef).tick();
    await settle();

    expect(api.announcements).toHaveBeenCalledExactlyOnceWith(GRACE.childId);
    expect(resource.value()?.items).toHaveLength(3);
    expect(session.childById(GRACE.childId)?.unreadAnnouncements).toBe(1);
  });

  it('lit les dates au fuseau de l’école, Kinshasa par défaut', async () => {
    const bootstrap = bootstrapFixture();
    const { facade } = await setup({
      ...bootstrap,
      school: { ...bootstrap.school, timeZone: 'Africa/Lubumbashi' },
    });

    expect(facade.timeZone()).toBe('Africa/Lubumbashi');
  });
});
