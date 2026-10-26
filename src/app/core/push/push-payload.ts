import { AnnouncementPushData } from '../api/push.contract';
import { returnPathOf } from '../session/return-path';

/**
 * `notification.data` d'une notification d'annonce, vérifié : le contenu vient du réseau, et
 * l'URL ouverte doit rester une page d'enfant du portail (liste blanche de `returnPath`).
 * Null pour tout autre contenu.
 */
export function announcementPush(data: unknown): AnnouncementPushData | null {
  if (!isRecord(data) || data['kind'] !== 'ANNOUNCEMENT') return null;
  const { childId, announcementId, unreadAnnouncements, onActionClick } = data;
  const action = isRecord(onActionClick) ? onActionClick['default'] : null;
  const url = isRecord(action) ? returnPathOf(stringOrNull(action['url'])) : null;
  if (
    typeof childId !== 'string' ||
    typeof announcementId !== 'string' ||
    !Number.isInteger(unreadAnnouncements) ||
    (unreadAnnouncements as number) < 0 ||
    !url ||
    !url.startsWith(`/c/${childId}/`)
  ) {
    return null;
  }
  return {
    kind: 'ANNOUNCEMENT',
    childId,
    announcementId,
    unreadAnnouncements: unreadAnnouncements as number,
    onActionClick: { default: { operation: 'focusLastFocusedOrOpen', url } },
  };
}

/** Le `data` d'une notification reçue par `SwPush.messages` (`{ notification: { data } }`). */
export function pushedData(message: unknown): unknown {
  return isRecord(message) && isRecord(message['notification'])
    ? message['notification']['data']
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}
