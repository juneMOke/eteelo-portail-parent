import { expect, test } from '@playwright/test';
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
    await expect(page.getByText('Mbote, Mme Kabila')).toBeVisible();
  });

  test('accepte la forme courte du lien envoyée par le serveur', async ({ page }) => {
    await mockParentApi(page);
    await page.goto('/m/jeton-du-lien');

    await expect(page).toHaveURL(`/c/${GRACE.childId}`);
  });
});
