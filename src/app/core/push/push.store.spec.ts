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

function fakeSubscription() {
  return {
    endpoint: ENDPOINT,
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
  save?: () => unknown;
}

describe('PushStore', () => {
  function setup(options: Setup = {}) {
    const bootstrap = signal(options.bootstrap ?? bootstrapFixture());
    const subscription = fakeSubscription();
    let permission = options.permission ?? 'default';
    const device = {
      support: options.support ?? 'supported',
      permission: () => permission,
      requestPermission: vi.fn(async () => (permission = options.answer ?? 'granted')),
      current: vi.fn(async () => (options.subscribed ? subscription : null)),
      subscribe: vi.fn(async () => subscription),
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
    return { api, device, router, session, store, subscription, swPush };
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

    it('ne vérifie qu’une fois par parent', async () => {
      const { device, store } = setup();
      await store.init();
      await store.init();
      expect(device.current).toHaveBeenCalledOnce();
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
      expect(store.parentId()).toBeNull();
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
