import { expect, test } from '@playwright/test';
import { GRACE } from '../src/testing/bootstrap.fixture';
import { FEE_ID, PAYMENT_ID, YEAR, paymentsFixture } from '../src/testing/finance.fixture';
import { mockParentApi } from './support/parent-api';

const PAYMENTS = `/c/${GRACE.childId}/finance/payments`;

test.describe('Mes paiements', () => {
  test("s'ouvre depuis l'Accueil sur le journal du mois", async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`/c/${GRACE.childId}`);

    await page.locator('app-tile').getByRole('link', { name: 'Mes paiements' }).click();

    await expect(page).toHaveURL(PAYMENTS);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mes paiements');
    await expect(page.locator('app-year-banner')).toContainText('2026-2027');
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
    await expect(sheet.getByRole('heading', { level: 2 })).toHaveText('100 $');
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
    await expect(sheet.getByText('Reçu en préparation')).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Copier la référence' })).toBeVisible();

    await sheet.getByRole('button', { name: 'Fermer' }).click();
    await expect(sheet).toBeHidden();
    await expect(page).toHaveURL(PAYMENTS);
  });

  test('ouvre une année précédente', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${PAYMENTS}?year=${YEAR.past}`);

    await expect(page.getByRole('heading', { name: 'Janvier 2026' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Septembre 2025' })).toBeVisible();
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

  test('au retour, montre les versements déjà lus, puis surligne ce qui a changé', async ({
    page,
  }) => {
    await mockParentApi(page);
    await page.goto(PAYMENTS);
    await expect(page.locator('app-finance-line')).toHaveCount(4);
    await page.getByRole('link', { name: 'Accueil' }).first().click();
    await expect(page).toHaveURL(`/c/${GRACE.childId}`);

    let release!: () => void;
    const answered = new Promise<void>((resolve) => (release = resolve));
    const [latest, ...others] = paymentsFixture();
    await page.route('**/api/v1/parent/children/*/payments', async (route) => {
      await answered;
      await route.fulfill({
        json: [{ ...latest, amounts: [{ amountInCents: 6_000, currency: 'USD' }] }, ...others],
      });
    });
    await page.locator('app-tile').getByRole('link', { name: 'Mes paiements' }).click();

    await expect(page.locator('app-finance-line')).toHaveCount(4);
    await expect(page.locator('.loading')).toHaveCount(0);
    release();
    await expect(page.locator('app-finance-line .amount').first()).toHaveText('60 $');
    await expect(page.locator('.refresh-highlight')).toHaveCount(1);
  });

  test('garde les versements déjà lus quand le réseau manque au retour', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(PAYMENTS);
    await expect(page.locator('app-finance-line')).toHaveCount(4);
    await page.getByRole('link', { name: 'Accueil' }).first().click();
    await expect(page).toHaveURL(`/c/${GRACE.childId}`);

    await page.route('**/api/v1/parent/children/*/payments', (route) => route.abort());
    await page.locator('app-tile').getByRole('link', { name: 'Mes paiements' }).click();

    await expect(page.locator('ui-stale-notice')).toContainText('Pas à jour');
    await expect(page.locator('app-finance-line')).toHaveCount(4);
  });
});
