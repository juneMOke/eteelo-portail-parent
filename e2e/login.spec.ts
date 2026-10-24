import { expect, test } from '@playwright/test';
import { ANNOUNCEMENT_ID } from '../src/testing/announcements.fixture';
import { GRACE } from '../src/testing/bootstrap.fixture';
import { mockParentApi } from './support/parent-api';

test.describe('Connexion', () => {
  test('demande un lien de connexion par WhatsApp', async ({ page }) => {
    await mockParentApi(page);
    await page.goto('/login');

    await page.getByLabel('Numéro de téléphone').fill('081 563 2080');
    const request = page.waitForRequest('**/api/v1/parent/auth/magic-link');
    await page.getByRole('button', { name: 'Recevoir le lien' }).click();

    expect((await request).postDataJSON()).toEqual({ phoneNumber: '+243815632080' });
    await expect(page.getByRole('status')).toContainText('Lien envoyé');
  });

  test('refuse un numéro invalide', async ({ page }) => {
    await mockParentApi(page);
    await page.goto('/login');

    await page.getByLabel('Numéro de téléphone').fill('123');
    await page.getByRole('button', { name: 'Recevoir le lien' }).click();

    await expect(page.getByText('Saisissez un numéro de mobile valide.')).toBeVisible();
  });

  test("ouvre la session depuis le lien reçu et mène à l'Accueil", async ({ page }) => {
    await mockParentApi(page);
    await page.goto('/login/jeton-du-lien');

    await expect(page).toHaveURL(`/c/${GRACE.childId}`);
    await expect(page.getByText('Mbote, Mme Léonie Kabila Mwamba')).toBeVisible();
  });

  test('garde la page demandée sans session et la confie au lien', async ({ page }) => {
    const requested = `/c/${GRACE.childId}/messages?announcement=${ANNOUNCEMENT_ID.meeting}`;
    await mockParentApi(page, { bootstrap: 401 });
    await page.goto(requested);

    await page.waitForURL(/\/login\?/);
    expect(new URL(page.url()).searchParams.get('returnPath')).toBe(requested);
    await page.getByLabel('Numéro de téléphone').fill('081 563 2080');
    const request = page.waitForRequest('**/api/v1/parent/auth/magic-link');
    await page.getByRole('button', { name: 'Recevoir le lien' }).click();

    expect((await request).postDataJSON()).toEqual({
      phoneNumber: '+243815632080',
      returnPath: requested,
    });
  });

  test('ouvre la page où mène le lien reçu', async ({ page }) => {
    const requested = `/c/${GRACE.childId}/messages?announcement=${ANNOUNCEMENT_ID.meeting}`;
    await mockParentApi(page, { sessionReturnPath: requested });
    await page.goto('/login/jeton-du-lien');

    await expect(page).toHaveURL(requested);
    await expect(
      page.getByRole('dialog', { name: 'Réunion des parents de 5e primaire B' }),
    ).toBeVisible();
  });

  test('accepte la forme courte du lien envoyée par le serveur', async ({ page }) => {
    await mockParentApi(page);
    await page.goto('/m/jeton-du-lien');

    await expect(page).toHaveURL(`/c/${GRACE.childId}`);
  });
});
