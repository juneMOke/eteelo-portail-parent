/**
 * Contrat des notifications du portail parent (Web Push), recopié de la proposition front
 * « Notifications du portail parent » du 25/10/2026, figé par les réponses du back du 26/10
 * (lots P1 et P2 pas encore livrés).
 *
 * À remplacer par les types générés (`npm run api:types`) dès que ces routes sont dans
 * l'OpenAPI de staging.
 */

/**
 * Causes fines (`detailCode`) d'un 400 sur PUT /push-subscriptions : le serveur n'accepte que les
 * services de push connus (Google, Mozilla, Apple, Microsoft) et des clés lisibles. Le navigateur
 * ne changera pas de service : réessayer ne sert à rien.
 */
export const PUSH_ENDPOINT_INVALID = 'PUSH_ENDPOINT_INVALID';
export const PUSH_KEYS_INVALID = 'PUSH_KEYS_INVALID';

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
