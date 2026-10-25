import type { AnnouncementPushData } from '../app/core/api/push.contract';
import { ANNOUNCEMENT_ID } from './announcements.fixture';
import { GRACE } from './bootstrap.fixture';

/** `notification.data` d'une notification d'annonce, telle que le serveur la construit. */
export function announcementPushFixture(
  overrides: Partial<AnnouncementPushData> = {},
): AnnouncementPushData {
  const childId = overrides.childId ?? GRACE.childId;
  const announcementId = overrides.announcementId ?? ANNOUNCEMENT_ID.meeting;
  return {
    kind: 'ANNOUNCEMENT',
    childId,
    announcementId,
    unreadAnnouncements: 3,
    onActionClick: {
      default: {
        operation: 'focusLastFocusedOrOpen',
        url: `/c/${childId}/messages?announcement=${announcementId}`,
      },
    },
    ...overrides,
  };
}
