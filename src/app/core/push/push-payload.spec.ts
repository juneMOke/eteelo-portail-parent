import { DAVID, GRACE } from '../../../testing/bootstrap.fixture';
import { announcementPushFixture } from '../../../testing/push.fixture';
import { announcementPush, pushedData } from './push-payload';

describe('announcementPush', () => {
  const data = announcementPushFixture();

  it('garde une notification d’annonce bien formée', () => {
    expect(announcementPush(structuredClone(data))).toEqual(data);
  });

  it('écarte tout autre contenu', () => {
    const url = (value: string) => ({
      default: { operation: 'focusLastFocusedOrOpen', url: value },
    });
    for (const raw of [
      null,
      'ANNOUNCEMENT',
      { ...data, kind: 'GRADE' },
      { ...data, childId: 42 },
      { ...data, unreadAnnouncements: -1 },
      { ...data, unreadAnnouncements: 1.5 },
      { ...data, onActionClick: undefined },
      { ...data, onActionClick: url('https://evil.example/') },
      { ...data, onActionClick: url('//evil.example/c/x') },
      // L'URL doit mener à l'enfant de la notification.
      { ...data, onActionClick: url(`/c/${DAVID.childId}/messages`) },
      { ...data, onActionClick: url(`/c/${GRACE.childId}`) },
    ]) {
      expect(announcementPush(raw)).toBeNull();
    }
  });
});

describe('pushedData', () => {
  it('lit `notification.data` d’un message reçu', () => {
    expect(pushedData({ notification: { title: 'Grâce', data: { kind: 'X' } } })).toEqual({
      kind: 'X',
    });
    expect(pushedData({ title: 'Grâce' })).toBeNull();
    expect(pushedData(null)).toBeNull();
  });
});
