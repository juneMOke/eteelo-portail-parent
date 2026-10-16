import { expect, test } from '@playwright/test';
import { GRACE } from '../src/testing/bootstrap.fixture';
import { FEE_ID, PAYMENT_ID } from '../src/testing/finance.fixture';
import { mockParentApi } from './support/parent-api';

const PAYMENTS = `/c/${GRACE.childId}/finance/payments`;

test.describe('Mes paiements', () => {
  test("s'ouvre depuis l'Accueil sur le journal du mois", async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`/c/${GRACE.childId}`);

    await page.locator('app-tile').getByRole('link', { name: 'Mes paiements' }).click();

    await expect(page).toHaveURL(PAYMENTS);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mes paiements');
    await expect(page.getByRole('heading', { name: 'Septembre 2026' })).toBeVisible();
    await expect(page.locator('ui-section-card .count')).toHaveText('4 versements');
    await expect(page.locator('app-finance-line .heading')).toHaveText([
      'Mardi 22/09 · Mobile money',
      'Samedi 12/09 · Espèces',
      'Samedi 05/09 · Espèces',
      'Jeudi 03/09 · Espèces',
    ]);
  });

  test('montre le perçu au guichet et mène au frais couvert', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${PAYMENTS}?payment=${PAYMENT_ID.registration}`);

    const sheet = page.getByRole('dialog', { name: 'Jeudi 03/09 · Espèces' });
    await expect(sheet).toContainText('280 000 FC au taux de 2 800 FC pour 1 $');
    await expect(
      sheet.getByRole('link', { name: /Ouvrir le reçu n° ETL-RC-2627-001031/ }),
    ).toHaveAttribute(
      'href',
      `/api/v1/parent/children/${GRACE.childId}/payments/${PAYMENT_ID.registration}/receipt`,
    );

    await sheet.getByRole('link', { name: /^Frais d’inscription/ }).click();
    await expect(page).toHaveURL(`/c/${GRACE.childId}/finance/fees?fee=${FEE_ID.registration}`);
    await expect(page.getByRole('dialog', { name: 'Frais d’inscription' })).toBeVisible();
  });

  test('dit un reçu en préparation', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${PAYMENTS}?payment=${PAYMENT_ID.airtel}`);

    const sheet = page.getByRole('dialog', { name: 'Mardi 22/09 · Mobile money' });
    await expect(sheet.getByText('Reçu en préparation.')).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Copier la référence' })).toBeVisible();
  });

  test('dit une année sans versement et mène aux frais', async ({ page }) => {
    await mockParentApi(page, { payments: [] });
    await page.goto(PAYMENTS);

    await expect(
      page.getByRole('heading', { name: 'Aucun versement enregistré cette année.' }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Voir les frais à payer' }).click();
    await expect(page).toHaveURL(`/c/${GRACE.childId}/finance/fees`);
  });
});
