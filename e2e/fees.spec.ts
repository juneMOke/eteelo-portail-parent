import { expect, test } from '@playwright/test';
import { GRACE } from '../src/testing/bootstrap.fixture';
import { FEE_ID, PAYMENT_ID, unpublishedFeesFixture } from '../src/testing/finance.fixture';
import { mockParentApi } from './support/parent-api';

const FEES = `/c/${GRACE.childId}/finance/fees`;

test.describe('Mes frais', () => {
  test("s'ouvre depuis l'Accueil : retard, bilan par devise, frais dans l'ordre", async ({
    page,
  }) => {
    await mockParentApi(page);
    await page.goto(`/c/${GRACE.childId}`);

    await page.locator('app-tile').getByRole('link', { name: 'Mes frais' }).click();

    await expect(page).toHaveURL(FEES);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mes frais');
    await expect(page.locator('app-overdue-banner')).toContainText(
      'Frais scolaires · 1re tranche · 80 $ en retard depuis le 15/09',
    );
    await expect(page.locator('app-balance-summary .remaining')).toHaveText([
      '314 $ restant',
      '100 000 FC restant',
    ]);
    await expect(page.locator('app-ledger-row .title')).toHaveText([
      'Frais scolaires · 1re tranche',
      'Transport scolaire · 1er trimestre',
      'Frais scolaires · 2e tranche',
      'Frais d’inscription',
    ]);
  });

  test('dit comment payer : le secrétariat, le reste bientôt disponible', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(FEES);

    await page.getByRole('button', { name: 'Comment payer' }).click();

    const sheet = page.getByRole('dialog', { name: 'Comment payer' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('link', { name: 'Appeler le secrétariat' })).toHaveAttribute(
      'href',
      'tel:+243998877665',
    );
    await expect(sheet.getByText('Bientôt disponible')).toHaveCount(2);
  });

  test('mène d’un frais à son versement, et le retour rouvre la fiche du frais', async ({
    page,
  }) => {
    await mockParentApi(page);
    await page.goto(FEES);

    await page.getByRole('button', { name: /^Frais scolaires, 1re tranche/ }).click();
    await expect(page).toHaveURL(`${FEES}?fee=${FEE_ID.firstInstalment}`);
    const feeSheet = page.getByRole('dialog', { name: 'Frais scolaires · 1re tranche' });
    await expect(feeSheet).toBeVisible();

    await feeSheet.getByRole('link', { name: /^Versement du mardi 22 septembre/ }).click();
    await expect(page).toHaveURL(
      `/c/${GRACE.childId}/finance/payments?payment=${PAYMENT_ID.airtel}`,
    );
    await expect(page.getByRole('dialog', { name: 'Mardi 22/09 · Mobile money' })).toBeVisible();

    await page.goBack();
    await expect(feeSheet).toBeVisible();
  });

  test('annonce des frais pas encore publiés', async ({ page }) => {
    await mockParentApi(page, { fees: unpublishedFeesFixture() });
    await page.goto(FEES);

    await expect(
      page.getByRole('heading', {
        name: 'Les frais de l’année 2026-2027 seront publiés par l’école.',
      }),
    ).toBeVisible();
    await expect(page.locator('app-balance-summary')).toHaveCount(0);
  });
});
