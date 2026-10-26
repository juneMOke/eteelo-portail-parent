import { Page } from '@playwright/test';
import { VAPID_PUBLIC_KEY } from '../../src/testing/bootstrap.fixture';

export interface FakePushDevice {
  /** Permission du site au chargement. */
  permission?: NotificationPermission;
  /** Réponse du parent à la demande de permission. */
  answer?: NotificationPermission;
  /** Ce téléphone est déjà abonné. */
  subscribed?: boolean;
  /** Clé VAPID de l'abonnement existant, si ce n'est pas celle du bootstrap. */
  subscribedWith?: string;
}

export const FAKE_ENDPOINT = 'https://fcm.googleapis.com/fcm/send/e2e-telephone';
/** Adresse de l'abonnement créé avec une autre clé que celle du bootstrap. */
export const STALE_ENDPOINT = 'https://fcm.googleapis.com/fcm/send/e2e-ancienne-cle';

/**
 * Le push du navigateur, simulé : en développement le service worker n'est pas enregistré, et
 * Chromium sans tête ne joint pas le service de push. Remplace `Notification` et
 * `navigator.serviceWorker` avant le chargement du portail.
 */
export async function fakePushDevice(page: Page, device: FakePushDevice = {}): Promise<void> {
  await page.addInitScript(
    ({
      permission,
      answer,
      subscribed,
      subscribedWith,
      endpoint,
      staleEndpoint,
      vapidPublicKey,
    }) => {
      let current: NotificationPermission = permission;
      const bytes = (key: string) => {
        const base64 = key.replace(/-/g, '+').replace(/_/g, '/');
        return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)).buffer;
      };
      const fakeSubscription = (address: string, applicationServerKey: ArrayBuffer) => ({
        endpoint: address,
        options: { applicationServerKey },
        toJSON: () => ({
          endpoint: address,
          expirationTime: null,
          keys: { p256dh: 'BNcRd-e2e', auth: 'tBHI-e2e' },
        }),
        unsubscribe: async () => {
          active = null;
          return true;
        },
      });
      type Subscription = ReturnType<typeof fakeSubscription>;
      let active: Subscription | null = subscribed
        ? subscribedWith
          ? fakeSubscription(staleEndpoint, bytes(subscribedWith))
          : fakeSubscription(endpoint, bytes(vapidPublicKey))
        : null;
      const pushManager = {
        getSubscription: async () => active,
        subscribe: async (options: { applicationServerKey: Uint8Array<ArrayBuffer> }) => {
          // Comme Chrome : pas de second abonnement avec une autre clé.
          if (active) throw new DOMException('Déjà abonné', 'InvalidStateError');
          return (active = fakeSubscription(endpoint, options.applicationServerKey.buffer));
        },
      };
      class FakeNotification {
        static get permission(): NotificationPermission {
          return current;
        }
        static async requestPermission(): Promise<NotificationPermission> {
          return (current = answer);
        }
      }
      Object.defineProperty(window, 'Notification', { value: FakeNotification });
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { ready: Promise.resolve({ pushManager }) },
      });
    },
    {
      permission: device.permission ?? 'default',
      answer: device.answer ?? 'granted',
      subscribed: device.subscribed ?? false,
      subscribedWith: device.subscribedWith,
      endpoint: FAKE_ENDPOINT,
      staleEndpoint: STALE_ENDPOINT,
      vapidPublicKey: VAPID_PUBLIC_KEY,
    },
  );
}
