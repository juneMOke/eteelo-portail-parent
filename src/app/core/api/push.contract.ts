/**
 * Contrat des notifications du portail parent (Web Push), recopié de la proposition front
 * « Notifications du portail parent » du 25/10/2026, en attente des réponses du back.
 *
 * À remplacer par les types générés (`npm run api:types`) dès que ces routes sont dans
 * l'OpenAPI de staging.
 */

/** Corps de PUT /push-subscriptions : `PushSubscription.toJSON()` tel quel. */
export interface PushSubscriptionBody {
  readonly endpoint: string;
  readonly expirationTime: number | null;
  readonly keys: { readonly p256dh: string; readonly auth: string };
}

/**
 * `notification.data` d'une notification d'annonce, construite par le serveur. Le service
 * worker d'Angular lit `onActionClick` quand le portail est fermé ; ouvert, le portail navigue
 * lui-même vers `url`.
 */
export interface AnnouncementPushData {
  readonly kind: 'ANNOUNCEMENT';
  readonly childId: string;
  /** L'`id` de `ParentAnnouncement`, celui de `?announcement=`. */
  readonly announcementId: string;
  /** Non-lues de l'enfant après cette annonce. */
  readonly unreadAnnouncements: number;
  readonly onActionClick: {
    readonly default: { readonly operation: 'focusLastFocusedOrOpen'; readonly url: string };
  };
}
