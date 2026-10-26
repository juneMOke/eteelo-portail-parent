import { Injectable } from '@angular/core';
import { PushSubscriptionBody } from '../api/push.contract';

/** Ce que ce navigateur permet : notifications, iPhone à installer d'abord, ou rien. */
export type PushSupport = 'supported' | 'install-first' | 'unsupported';

/**
 * Le téléphone vu par les notifications : permission, abonnement au service de push.
 * Enveloppe fine des API du navigateur (Notification, PushManager), sans état ni réseau
 * vers notre API : c'est `PushStore` qui décide et parle au serveur.
 */
@Injectable({ providedIn: 'root' })
export class PushDevice {
  readonly support: PushSupport = pushSupport();

  permission(): NotificationPermission {
    return this.support === 'supported' ? Notification.permission : 'denied';
  }

  requestPermission(): Promise<NotificationPermission> {
    return Notification.requestPermission();
  }

  /**
   * L'abonnement de ce téléphone, ou null. Attend l'enregistrement du service worker : sans
   * service worker (développement), la promesse ne se résout jamais.
   */
  async current(): Promise<PushSubscription | null> {
    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  }

  async subscribe(vapidPublicKey: string): Promise<PushSubscription> {
    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(vapidPublicKey),
    });
  }

  /** Désabonne ce téléphone ; rend l'`endpoint` retiré, null s'il n'y en avait pas. */
  async unsubscribe(): Promise<string | null> {
    const subscription = await this.current();
    if (!subscription) return null;
    await subscription.unsubscribe();
    return subscription.endpoint;
  }
}

/** Le corps attendu par le serveur ; null si l'abonnement n'a pas ses clés. */
export function subscriptionBody(subscription: PushSubscription): PushSubscriptionBody | null {
  const { endpoint, expirationTime, keys } = subscription.toJSON();
  if (!endpoint || !keys?.['p256dh'] || !keys['auth']) return null;
  return {
    endpoint,
    expirationTime: expirationTime ?? null,
    keys: { p256dh: keys['p256dh'], auth: keys['auth'] },
  };
}

function pushSupport(): PushSupport {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'unsupported';
  if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
    return 'supported';
  }
  // Safari sur iPhone n'offre le push qu'au portail ajouté à l'écran d'accueil (iOS 16.4+).
  return /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'install-first' : 'unsupported';
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
