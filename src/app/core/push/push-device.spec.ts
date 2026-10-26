import { VAPID_PUBLIC_KEY } from '../../../testing/bootstrap.fixture';
import { subscriptionBody, usesKey } from './push-device';

describe('subscriptionBody', () => {
  function subscription(json: PushSubscriptionJSON): PushSubscription {
    return { toJSON: () => json } as PushSubscription;
  }

  it('rend `toJSON()` sous la forme attendue par le serveur', () => {
    expect(
      subscriptionBody(
        subscription({
          endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
          keys: { p256dh: 'BNcRd', auth: 'tBHI' },
        }),
      ),
    ).toEqual({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      expirationTime: null,
      keys: { p256dh: 'BNcRd', auth: 'tBHI' },
    });
  });

  it('écarte un abonnement sans adresse ou sans clés', () => {
    expect(subscriptionBody(subscription({ keys: { p256dh: 'a', auth: 'b' } }))).toBeNull();
    expect(
      subscriptionBody(subscription({ endpoint: 'https://x', keys: { auth: 'b' } })),
    ).toBeNull();
    expect(subscriptionBody(subscription({ endpoint: 'https://x' }))).toBeNull();
  });
});

describe('usesKey', () => {
  function subscription(key: ArrayBuffer | null): PushSubscription {
    return { options: { applicationServerKey: key } } as PushSubscription;
  }

  function bytes(vapidPublicKey: string): ArrayBuffer {
    const base64 = vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/');
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)).buffer;
  }

  it('reconnaît la clé du serveur, encodée en base64url', () => {
    expect(usesKey(subscription(bytes(VAPID_PUBLIC_KEY)), VAPID_PUBLIC_KEY)).toBe(true);
  });

  it('écarte une autre clé ou un abonnement sans clé', () => {
    expect(
      usesKey(subscription(bytes('BOLD-key_from-an-old-configuration')), VAPID_PUBLIC_KEY),
    ).toBe(false);
    expect(usesKey(subscription(null), VAPID_PUBLIC_KEY)).toBe(false);
  });
});
