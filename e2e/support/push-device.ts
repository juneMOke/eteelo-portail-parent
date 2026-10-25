import { Page } from '@playwright/test';

export interface FakePushDevice {
  /** Permission du site au chargement. */
  permission?: NotificationPermission;
  /** Réponse du parent à la demande de permission. */
  answer?: NotificationPermission;
  /** Ce téléphone est déjà abonné. */
  subscribed?: boolean;
}

export const FAKE_ENDPOINT = 'https://fcm.googleapis.com/fcm/send/e2e-telephone';

/**
 * Le push du navigateur, simulé : en développement le service worker n'est pas enregistré, et
 * Chromium sans tête ne joint pas le service de push. Remplace `Notification` et
 * `navigator.serviceWorker` avant le chargement du portail.
 */
export async function fakePushDevice(page: Page, device: FakePushDevice = {}): Promise<void> {
  await page.addInitScript(
    ({ permission, answer, subscribed, endpoint }) => {
      let current: NotificationPermission = permission;
      const subscription = {
        endpoint,
        toJSON: () => ({
          endpoint,
          expirationTime: null,
          keys: { p256dh: 'BNcRd-e2e', auth: 'tBHI-e2e' },
        }),
        unsubscribe: async () => {
          active = null;
          return true;
        },
      };
      let active: typeof subscription | null = subscribed ? subscription : null;
      const pushManager = {
        getSubscription: async () => active,
        subscribe: async () => (active = subscription),
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
      endpoint: FAKE_ENDPOINT,
    },
  );
}
