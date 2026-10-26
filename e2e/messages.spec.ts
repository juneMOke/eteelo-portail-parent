import { expect, test } from '@playwright/test';
import { ANNOUNCEMENT_ID, announcementsFixture } from '../src/testing/announcements.fixture';
import { GRACE } from '../src/testing/bootstrap.fixture';
import { mockParentApi } from './support/parent-api';

const MESSAGES = `/c/${GRACE.childId}/messages`;

test.describe('Mes messages', () => {
  test("s'ouvre depuis l'Accueil, la plus récente en haut, les non lues signalées", async ({
    page,
  }) => {
    await mockParentApi(page);
    await page.goto(`/c/${GRACE.childId}`);

    const tile = page.locator('app-tile').getByRole('link', { name: /Mes messages/ });
    await expect(tile).toHaveAccessibleName(/^Mes messages\s*, 2 nouveaux$/);
    await tile.click();

    await expect(page).toHaveURL(MESSAGES);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mes messages');
    await expect(page.locator('app-announcement-card .title')).toHaveText([
      'Réunion des parents de 5e primaire B',
      'Rappel : minerval du 1er trimestre',
      'École fermée lundi 13 octobre',
      'Port de l’uniforme',
    ]);
    await expect(page.locator('app-announcement-card.unread')).toHaveCount(2);
    await expect(page.locator('app-announcement-card').first()).toContainText('Événement');
  });

  test('ouvre une annonce, la marque lue et met le badge à jour', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(MESSAGES);

    const read = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        request.url().endsWith(`/announcements/${ANNOUNCEMENT_ID.meeting}/read`),
    );
    await page.getByRole('button', { name: /Réunion des parents/ }).click();

    const sheet = page.getByRole('dialog', { name: 'Réunion des parents de 5e primaire B' });
    await expect(sheet).toContainText('la réunion aura lieu samedi à 9 h');
    await expect(sheet).toContainText('Samedi 24 octobre · 9 h 30');
    await read;
    await expect(page).toHaveURL(`${MESSAGES}?announcement=${ANNOUNCEMENT_ID.meeting}`);

    await sheet.getByRole('button', { name: 'Fermer' }).click();
    await expect(page).toHaveURL(MESSAGES);
    await expect(page.locator('app-announcement-card.unread')).toHaveCount(1);
    await expect(
      page.locator('app-top-bar').getByRole('link', { name: 'Mes messages, 1 nouveau' }),
    ).toBeVisible();
  });

  test('rappelle que le reste dû cité date de l’envoi et mène à Mes frais', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${MESSAGES}?announcement=${ANNOUNCEMENT_ID.balance}`);

    const sheet = page.getByRole('dialog', { name: 'Rappel : minerval du 1er trimestre' });
    await expect(sheet).toContainText('Montant arrêté au jour de l’envoi.');
    await sheet.getByRole('link', { name: 'Voir mes frais' }).click();

    await expect(page).toHaveURL(`/c/${GRACE.childId}/finance/fees`);
  });

  test('ne propose pas de répondre', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${MESSAGES}?announcement=${ANNOUNCEMENT_ID.closure}`);

    const sheet = page.getByRole('dialog', { name: 'École fermée lundi 13 octobre' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('textbox')).toHaveCount(0);
    await expect(sheet.getByRole('button')).toHaveAccessibleName('Fermer');
  });

  test('dit une année sans message', async ({ page }) => {
    await mockParentApi(page, { announcements: announcementsFixture([]) });
    await page.goto(MESSAGES);

    await expect(
      page.getByRole('heading', { name: 'Aucun message de l’école cette année' }),
    ).toBeVisible();
    await expect(page.locator('app-tile, app-announcement-card')).toHaveCount(0);
  });

  test('dit un message introuvable', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${MESSAGES}?announcement=00000000-0000-4000-8000-000000000000`);

    await expect(page.getByRole('heading', { name: 'Message introuvable' })).toBeVisible();
    await page.getByRole('button', { name: 'Voir tous les messages' }).click();
    await expect(page).toHaveURL(MESSAGES);
    await expect(page.getByRole('heading', { name: 'Message introuvable' })).toBeHidden();
  });

  test('propose de réessayer quand la liste ne se charge pas', async ({ page }) => {
    await mockParentApi(page, { announcements: 500 });
    await page.goto(MESSAGES);

    await expect(
      page.getByRole('heading', { name: 'Impossible d’afficher les messages' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible();
  });
});
