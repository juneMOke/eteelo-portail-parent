import { Page, expect, test } from '@playwright/test';
import { GRACE } from '../src/testing/bootstrap.fixture';
import { YEAR } from '../src/testing/finance.fixture';
import { mockParentApi } from './support/parent-api';

const RECEIPTS = `/c/${GRACE.childId}/finance/receipts`;

/** Choisit une année : pilule au grand écran, menu déroulant au téléphone et à la tablette. */
async function pickYear(page: Page, label: string): Promise<void> {
  const pill = page.getByRole('radio', { name: label });
  if (await pill.isVisible()) return pill.click();
  await page.getByRole('button', { name: /Année scolaire/ }).click();
  await page.getByRole('option', { name: label }).click();
}

test.describe('Mes reçus', () => {
  test("s'ouvre depuis l'Accueil sur les reçus de l'année", async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`/c/${GRACE.childId}`);

    await page.locator('app-tile').getByRole('link', { name: 'Mes reçus' }).click();

    await expect(page).toHaveURL(RECEIPTS);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mes reçus');
    await expect(
      page.locator('ui-pill-group [aria-checked="true"], ui-filter-menu .value-label'),
    ).toHaveText('2026-2027');
    await expect(page.locator('ui-section-card .count')).toHaveText('3 reçus');
    await expect(page.locator('app-receipt-row .name')).toHaveText([
      'Reçu n° ETL-RC-2627-001061',
      'Reçu n° ETL-RC-2627-001042',
      'Reçu n° ETL-RC-2627-001031',
    ]);
    await expect(
      page.getByRole('button', { name: 'Ouvrir le relevé de l’année 2026-2027' }),
    ).toBeVisible();
  });

  test('ouvre une année précédente', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(RECEIPTS);
    await expect(page.locator('app-receipt-row')).toHaveCount(3);

    await pickYear(page, '2025-2026');

    await expect(page).toHaveURL(`${RECEIPTS}?year=${YEAR.past}`);
    await expect(page.locator('app-receipt-row .name')).toHaveText([
      'Reçu n° ETL-RC-2526-000912',
      'Reçu n° ETL-RC-2526-000415',
    ]);
  });

  test('ouvre le relevé de l’année dans un nouvel onglet', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(RECEIPTS);

    const statement = page.waitForRequest(
      (request) => request.method() === 'POST' && request.url().endsWith('/statement'),
    );
    const tab = page.waitForEvent('popup');
    await page.getByRole('button', { name: 'Ouvrir le relevé de l’année 2026-2027' }).click();

    await statement;
    await expect((await tab).url()).toMatch(/^(blob:|about:blank)/);
  });

  test('dit une année sans versement, sans relevé', async ({ page }) => {
    await mockParentApi(page, { payments: [] });
    await page.goto(RECEIPTS);

    await expect(
      page.getByRole('heading', { name: 'Aucun versement enregistré cette année.' }),
    ).toBeVisible();
    await expect(page.locator('app-statement-footer')).toHaveCount(0);
  });
});
