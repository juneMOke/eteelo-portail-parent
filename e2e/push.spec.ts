import { expect, test } from '@playwright/test';
import { GRACE, bootstrapFixture } from '../src/testing/bootstrap.fixture';
import { mockParentApi } from './support/parent-api';
import { FAKE_ENDPOINT, STALE_ENDPOINT, fakePushDevice } from './support/push-device';

const MESSAGES = `/c/${GRACE.childId}/messages`;
const SUBSCRIPTIONS = '/api/v1/parent/push-subscriptions';

test.describe('Notifications de Mes messages', () => {
  test('les active à la demande et enregistre ce téléphone', async ({ page }) => {
    await fakePushDevice(page);
    await mockParentApi(page);
    await page.goto(MESSAGES);

    const card = page.locator('app-push-card');
    await expect(card).toContainText('Être prévenu quand l’école écrit');

    const saved = page.waitForRequest(
      (request) => request.method() === 'PUT' && request.url().endsWith(SUBSCRIPTIONS),
    );
    await card.getByRole('button', { name: 'Activer' }).click();
    expect((await saved).postDataJSON()).toEqual({
      endpoint: FAKE_ENDPOINT,
      expirationTime: null,
      keys: { p256dh: 'BNcRd-e2e', auth: 'tBHI-e2e' },
    });
    await expect(card).toContainText('Notifications activées sur ce téléphone');
  });

  test('un téléphone déjà abonné est resynchronisé, puis se désabonne', async ({ page }) => {
    await fakePushDevice(page, { permission: 'granted', subscribed: true });
    await mockParentApi(page);
    const resync = page.waitForRequest(
      (request) => request.method() === 'PUT' && request.url().endsWith(SUBSCRIPTIONS),
    );
    await page.goto(MESSAGES);
    await resync;

    const card = page.locator('app-push-card');
    await expect(card).toContainText('Notifications activées sur ce téléphone');

    const removed = page.waitForRequest(
      (request) => request.method() === 'DELETE' && request.url().endsWith(SUBSCRIPTIONS),
    );
    await card.getByRole('button', { name: 'Désactiver' }).click();
    expect((await removed).postDataJSON()).toEqual({ endpoint: FAKE_ENDPOINT });
    await expect(card.getByRole('button', { name: 'Activer' })).toBeVisible();
  });

  test('un téléphone abonné avec une ancienne clé se réabonne avec celle du serveur', async ({
    page,
  }) => {
    await fakePushDevice(page, {
      permission: 'granted',
      subscribed: true,
      subscribedWith: 'BOLD-key_from-an-old-configuration',
    });
    await mockParentApi(page);
    const resync = page.waitForRequest(
      (request) => request.method() === 'PUT' && request.url().endsWith(SUBSCRIPTIONS),
    );
    await page.goto(MESSAGES);

    const body = (await resync).postDataJSON() as { endpoint: string };
    expect(body.endpoint).toBe(FAKE_ENDPOINT);
    expect(body.endpoint).not.toBe(STALE_ENDPOINT);
    await expect(page.locator('app-push-card')).toContainText(
      'Notifications activées sur ce téléphone',
    );
  });

  test('explique comment les débloquer quand le navigateur les refuse', async ({ page }) => {
    await fakePushDevice(page, { answer: 'denied' });
    await mockParentApi(page);
    await page.goto(MESSAGES);

    const card = page.locator('app-push-card');
    await card.getByRole('button', { name: 'Activer' }).click();
    await expect(card).toContainText('Notifications bloquées sur ce téléphone');
    await expect(card.getByRole('button')).toHaveCount(0);
  });

  test('signale un échec du serveur et reste proposée', async ({ page }) => {
    await fakePushDevice(page);
    await mockParentApi(page, { pushSubscription: 503 });
    await page.goto(MESSAGES);

    const card = page.locator('app-push-card');
    await card.getByRole('button', { name: 'Activer' }).click();
    await expect(card.getByRole('alert')).toHaveText(
      'Impossible d’activer les notifications. Vérifiez la connexion, puis réessayez.',
    );
    await expect(card.getByRole('button', { name: 'Activer' })).toBeEnabled();
  });

  test('renvoie vers Chrome quand le serveur refuse le service de push du navigateur', async ({
    page,
  }) => {
    await fakePushDevice(page);
    await mockParentApi(page, {
      pushSubscription: 400,
      pushSubscriptionCode: 'PUSH_ENDPOINT_INVALID',
    });
    await page.goto(MESSAGES);

    const card = page.locator('app-push-card');
    await card.getByRole('button', { name: 'Activer' }).click();
    await expect(card).toContainText('Ouvrez le portail dans Chrome');
    await expect(card.getByRole('button')).toHaveCount(0);
    await expect(card.getByRole('alert')).toHaveCount(0);
  });

  test('ne propose rien quand le serveur les a coupées', async ({ page }) => {
    await fakePushDevice(page);
    await mockParentApi(page, { bootstrap: { ...bootstrapFixture(), push: null } });
    await page.goto(MESSAGES);

    await expect(page.locator('app-announcement-card')).toHaveCount(4);
    await expect(page.locator('app-push-card')).toHaveCount(0);
  });
});
