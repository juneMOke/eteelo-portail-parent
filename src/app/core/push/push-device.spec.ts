import { subscriptionBody } from './push-device';

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
