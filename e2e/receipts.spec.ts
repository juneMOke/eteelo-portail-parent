import { Page, expect, test } from '@playwright/test';
import { GRACE } from '../src/testing/bootstrap.fixture';
import { YEAR } from '../src/testing/finance.fixture';
import { mockParentApi } from './support/parent-api';

const RECEIPTS = `/c/${GRACE.childId}/finance/receipts`;

/** Choisit une année : pilule dès la tablette, menu déroulant au téléphone. */
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
      page.locator('app-year-banner [aria-checked="true"], ui-filter-menu .value-label'),
    ).toHaveText('2026-2027');
    await expect(page.locator('ui-section-card .count')).toHaveText('4 reçus');
    await expect(page.locator('app-receipt-row .name')).toHaveText([
      'Reçu en préparation',
      'Reçu n° ETL-RC-2627-001061',
      'Reçu n° ETL-RC-2627-001042',
      'Reçu n° ETL-RC-2627-001031',
    ]);
    await expect(page.getByText('Versement enregistré le 22/09')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Ouvrir le reçu n° ETL-RC-2627-001061' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Télécharger le relevé de l’année 2026-2027' }),
    ).toBeVisible();
  });

  test('ouvre une année précédente', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(RECEIPTS);
    await expect(page.locator('app-receipt-row')).toHaveCount(4);

    await pickYear(page, '2025-2026');

    await expect(page).toHaveURL(`${RECEIPTS}?year=${YEAR.past}`);
    await expect(page.locator('app-receipt-row .name')).toHaveText([
      'Reçu n° ETL-RC-2526-000912',
      'Reçu n° ETL-RC-2526-000415',
    ]);
  });

  test('télécharge le relevé de l’année et le confirme', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(RECEIPTS);

    const statement = page.waitForRequest(
      (request) => request.method() === 'POST' && request.url().endsWith('/statement'),
    );
    const file = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger le relevé de l’année 2026-2027' }).click();

    await statement;
    expect((await file).suggestedFilename()).toBe('Releve-2026-2027.pdf');
    await expect(page.getByRole('status').filter({ hasText: 'enregistré' })).toHaveText(
      'Relevé de l’année 2026-2027 enregistré',
    );
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
