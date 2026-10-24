import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { ParentAnnouncementReadResult } from '../../../core/api/announcements.contract';
import {
  ANNOUNCEMENT_ID,
  announcementsFixture,
  readResultFixture,
} from '../../../../testing/announcements.fixture';
import { GRACE } from '../../../../testing/bootstrap.fixture';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';
import { AnnouncementReadStore } from './announcement-read.store';

describe('AnnouncementReadStore', () => {
  const list = announcementsFixture();
  const [unread, , read] = list.items;
  const { result } = readResultFixture(list, ANNOUNCEMENT_ID.meeting)!;

  function setup(response: () => unknown) {
    const api = { markAnnouncementRead: vi.fn(response) };
    const session = { setUnreadAnnouncements: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        AnnouncementReadStore,
        { provide: ParentApi, useValue: api },
        { provide: SessionStore, useValue: session },
      ],
    });
    return { api, session, store: TestBed.inject(AnnouncementReadStore) };
  }

  it('marque lue une annonce non lue et met le badge au compte du serveur', async () => {
    const { api, session, store } = setup(() => of(result));

    await expect(store.markRead(GRACE.childId, unread)).resolves.toEqual(result);

    expect(api.markAnnouncementRead).toHaveBeenCalledExactlyOnceWith(GRACE.childId, unread.id);
    expect(session.setUnreadAnnouncements).toHaveBeenCalledWith(GRACE.childId, 1);
  });

  it('n’appelle pas le serveur pour une annonce déjà lue', async () => {
    const { api, store } = setup(() => of(result));

    await expect(store.markRead(GRACE.childId, read)).resolves.toBeNull();
    expect(api.markAnnouncementRead).not.toHaveBeenCalled();
  });

  it('n’envoie qu’une lecture à la fois pour une même annonce', async () => {
    const response = new Subject<ParentAnnouncementReadResult>();
    const { api, store } = setup(() => response);

    const first = store.markRead(GRACE.childId, unread);
    await expect(store.markRead(GRACE.childId, unread)).resolves.toBeNull();
    response.next(result);
    response.complete();

    await expect(first).resolves.toEqual(result);
    expect(api.markAnnouncementRead).toHaveBeenCalledOnce();
  });

  it('laisse l’annonce non lue en cas d’échec, sans erreur', async () => {
    const { session, store } = setup(() => throwError(() => new Error('réseau')));

    await expect(store.markRead(GRACE.childId, unread)).resolves.toBeNull();
    expect(session.setUnreadAnnouncements).not.toHaveBeenCalled();
    expect(store.pending()).toEqual([]);
  });
});
