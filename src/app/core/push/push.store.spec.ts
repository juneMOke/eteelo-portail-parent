import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { Subject, of, throwError } from 'rxjs';
import { failingWith, settle } from '../../../testing/async';
import { GRACE, VAPID_PUBLIC_KEY, bootstrapFixture } from '../../../testing/bootstrap.fixture';
import { announcementPushFixture } from '../../../testing/push.fixture';
import { ParentApi } from '../api/parent-api';
import { Bootstrap } from '../session/bootstrap.schema';
import { SessionStore } from '../session/session.store';
import { PushDevice, PushSupport } from './push-device';
import { PushStore } from './push.store';

const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc';

/** Le serveur refuse ce téléphone : service de push hors de sa liste. */
const refusedEndpoint = () =>
  throwError(
    () => new HttpErrorResponse({ status: 400, error: { detailCode: 'PUSH_ENDPOINT_INVALID' } }),
  );

/** La clé publique VAPID telle que le navigateur la garde dans l'abonnement. */
function keyBytes(vapidPublicKey: string): ArrayBuffer {
  const base64 = vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)).buffer;
}

function fakeSubscription(vapidPublicKey = VAPID_PUBLIC_KEY) {
  return {
    endpoint: ENDPOINT,
    options: { applicationServerKey: keyBytes(vapidPublicKey) },
    toJSON: () => ({ endpoint: ENDPOINT, keys: { p256dh: 'BNcRd', auth: 'tBHI' } }),
    unsubscribe: vi.fn(async () => true),
  };
}

interface Setup {
  bootstrap?: Bootstrap;
  support?: PushSupport;
  permission?: NotificationPermission;
  answer?: NotificationPermission;
  subscribed?: boolean;
  /** Clé avec laquelle le téléphone s'est abonné, si ce n'est pas celle du serveur. */
  subscribedWith?: string;
  save?: () => unknown;
}

describe('PushStore', () => {
  function setup(options: Setup = {}) {
    const bootstrap = signal(options.bootstrap ?? bootstrapFixture());
    const subscription = fakeSubscription(options.subscribedWith);
    const renewed = fakeSubscription();
    let permission = options.permission ?? 'default';
    const device = {
      support: options.support ?? 'supported',
      permission: () => permission,
      requestPermission: vi.fn(async () => (permission = options.answer ?? 'granted')),
      current: vi.fn(async () => (options.subscribed ? subscription : null)),
      subscribe: vi.fn(async () => (options.subscribedWith ? renewed : subscription)),
      unsubscribe: vi.fn(async () => ENDPOINT),
    };
    const api = {
      savePushSubscription: vi.fn(options.save ?? (() => of(undefined))),
      deletePushSubscription: vi.fn(() => of(undefined)),
    };
    const session = {
      bootstrap,
      parent: () => bootstrap().parent,
      setUnreadAnnouncements: vi.fn(),
    };
    const swPush = { messages: new Subject<object>(), notificationClicks: new Subject<object>() };
    const router = { navigateByUrl: vi.fn(async () => true) };
    TestBed.configureTestingModule({
      providers: [
        { provide: ParentApi, useValue: api },
        { provide: PushDevice, useValue: device },
        { provide: SessionStore, useValue: session },
        { provide: SwPush, useValue: swPush },
        { provide: Router, useValue: router },
      ],
    });
    const store = TestBed.inject(PushStore);
    return { api, bootstrap, device, router, session, store, subscription, swPush };
  }

  describe('à l’ouverture de la session', () => {
    it('propose l’activation à un téléphone qui n’est pas abonné', async () => {
      const { api, store } = setup();
      await store.init();
      expect(store.status()).toBe('available');
      expect(api.savePushSubscription).not.toHaveBeenCalled();
    });

    it('renvoie au serveur l’abonnement d’un téléphone déjà abonné', async () => {
      const { api, store } = setup({ permission: 'granted', subscribed: true });
      await store.init();
      expect(store.status()).toBe('enabled');
      expect(api.savePushSubscription).toHaveBeenCalledExactlyOnceWith({
        endpoint: ENDPOINT,
        expirationTime: null,
        keys: { p256dh: 'BNcRd', auth: 'tBHI' },
      });
    });

    it('reste activée si ce renvoi échoue', async () => {
      const { store } = setup({
        permission: 'granted',
        subscribed: true,
        save: () => throwError(() => new Error('réseau')),
      });
      await store.init();
      expect(store.status()).toBe('enabled');
    });

    it('désabonne le téléphone que le serveur refuse, et le dit', async () => {
      const { store, subscription } = setup({
        permission: 'granted',
        subscribed: true,
        save: refusedEndpoint,
      });
      await store.init();
      expect(subscription.unsubscribe).toHaveBeenCalledOnce();
      expect(store.status()).toBe('unsupported-service');
    });

    it('ne vérifie qu’une fois par bootstrap', async () => {
      const { device, store } = setup();
      await store.init();
      await store.init();
      expect(device.current).toHaveBeenCalledOnce();
    });

    it('renvoie l’abonnement après un nouveau bootstrap (reconnexion, autre parent)', async () => {
      const { api, bootstrap, store } = setup({ permission: 'granted', subscribed: true });
      await store.init();
      bootstrap.set(bootstrapFixture());
      await store.init();
      expect(api.savePushSubscription).toHaveBeenCalledTimes(2);
    });

    it('réabonne le téléphone si le serveur a changé de clé, puis l’enregistre', async () => {
      const { api, device, store } = setup({
        permission: 'granted',
        subscribed: true,
        subscribedWith: 'BOLD-key_from-an-old-configuration',
      });
      await store.init();
      expect(device.subscribe).toHaveBeenCalledExactlyOnceWith(VAPID_PUBLIC_KEY);
      expect(api.savePushSubscription).toHaveBeenCalledOnce();
      expect(store.status()).toBe('enabled');
    });

    it('propose l’activation si ce réabonnement échoue', async () => {
      const { api, device, store } = setup({
        permission: 'granted',
        subscribed: true,
        subscribedWith: 'BOLD-key_from-an-old-configuration',
      });
      device.subscribe.mockImplementation(failingWith(new Error('navigateur')));
      await store.init();
      expect(api.savePushSubscription).not.toHaveBeenCalled();
      expect(store.status()).toBe('available');
    });

    it('n’envoie pas l’abonnement de la même clé une seconde fois au navigateur', async () => {
      const { device, store } = setup({ permission: 'granted', subscribed: true });
      await store.init();
      expect(device.subscribe).not.toHaveBeenCalled();
    });

    it('ne propose rien quand le serveur les coupe ou que le navigateur ne sait pas', async () => {
      const off = setup({ bootstrap: { ...bootstrapFixture(), push: null } });
      await off.store.init();
      expect(off.store.status()).toBe('hidden');

      TestBed.resetTestingModule();
      const unsupported = setup({ support: 'unsupported' });
      await unsupported.store.init();
      expect(unsupported.store.status()).toBe('hidden');
    });

    it('dit d’installer le portail sur iPhone, et signale un refus du navigateur', async () => {
      const iphone = setup({ support: 'install-first' });
      await iphone.store.init();
      expect(iphone.store.status()).toBe('install-first');

      TestBed.resetTestingModule();
      const denied = setup({ permission: 'denied' });
      await denied.store.init();
      expect(denied.store.status()).toBe('denied');
      expect(denied.device.current).not.toHaveBeenCalled();
    });
  });

  describe('activation', () => {
    it('demande la permission, abonne le téléphone avec la clé du serveur et l’enregistre', async () => {
      const { api, device, store } = setup();
      await store.init();
      await store.enable();

      expect(device.requestPermission).toHaveBeenCalledOnce();
      expect(device.subscribe).toHaveBeenCalledExactlyOnceWith(VAPID_PUBLIC_KEY);
      expect(api.savePushSubscription).toHaveBeenCalledOnce();
      expect(store.status()).toBe('enabled');
      expect(store.busy()).toBe(false);
    });

    it('reste proposée si le parent ferme la demande, bloquée s’il refuse', async () => {
      const dismissed = setup({ answer: 'default' });
      await dismissed.store.enable();
      expect(dismissed.store.status()).toBe('available');
      expect(dismissed.device.subscribe).not.toHaveBeenCalled();

      TestBed.resetTestingModule();
      const refused = setup({ answer: 'denied' });
      await refused.store.enable();
      expect(refused.store.status()).toBe('denied');
      expect(refused.store.failed()).toBe(false);
    });

    it('désabonne le téléphone si le serveur ne l’enregistre pas, et le signale', async () => {
      const { store, subscription } = setup({ save: () => throwError(() => new Error('503')) });
      await store.init();
      await store.enable();

      expect(subscription.unsubscribe).toHaveBeenCalledOnce();
      expect(store.status()).toBe('available');
      expect(store.failed()).toBe(true);
    });

    it('dit que ce navigateur ne convient pas quand le serveur refuse son service de push', async () => {
      const { store, subscription } = setup({ save: refusedEndpoint });
      await store.init();
      await store.enable();

      expect(subscription.unsubscribe).toHaveBeenCalledOnce();
      expect(store.status()).toBe('unsupported-service');
      expect(store.failed()).toBe(false);
    });
  });

  describe('désactivation', () => {
    it('désabonne le téléphone et le retire du serveur', async () => {
      const { api, device, store } = setup({ permission: 'granted', subscribed: true });
      await store.init();
      await store.disable();

      expect(device.unsubscribe).toHaveBeenCalledOnce();
      expect(api.deletePushSubscription).toHaveBeenCalledExactlyOnceWith(ENDPOINT);
      expect(store.status()).toBe('available');
    });

    it('reste activée et le signale si le téléphone ne se désabonne pas', async () => {
      const { device, store } = setup({ permission: 'granted', subscribed: true });
      await store.init();
      device.unsubscribe.mockImplementation(failingWith(new Error('navigateur')));
      await store.disable();

      expect(store.status()).toBe('enabled');
      expect(store.failed()).toBe(true);
    });

    it('à la déconnexion, oublie l’état et désabonne le téléphone', async () => {
      const { device, store } = setup({ permission: 'granted', subscribed: true });
      await store.init();
      store.forget();

      expect(store.status()).toBe('idle');
      expect(device.unsubscribe).toHaveBeenCalledOnce();
    });
  });

  describe('portail ouvert', () => {
    it('une notification reçue met la pastille de l’enfant au compte du serveur', () => {
      const { session, store, swPush } = setup();
      swPush.messages.next({ notification: { title: 'Grâce', data: announcementPushFixture() } });

      expect(session.setUnreadAnnouncements).toHaveBeenCalledExactlyOnceWith(GRACE.childId, 3);
      expect(store.arrival()?.childId).toBe(GRACE.childId);
    });

    it('ignore une notification d’un autre genre', () => {
      const { session, store, swPush } = setup();
      swPush.messages.next({ notification: { title: 'X', data: { kind: 'GRADE' } } });

      expect(session.setUnreadAnnouncements).not.toHaveBeenCalled();
      expect(store.arrival()).toBeNull();
    });

    it('un appui ouvre l’annonce sans recharger le portail', async () => {
      const { router, swPush } = setup();
      const data = announcementPushFixture();
      swPush.notificationClicks.next({ action: '', notification: { title: 'Grâce', data } });
      await settle();

      expect(router.navigateByUrl).toHaveBeenCalledExactlyOnceWith(data.onActionClick.default.url);
    });
  });
});
