import { expect, test } from '@playwright/test';
import { GRACE } from '../src/testing/bootstrap.fixture';
import { mockParentApi } from './support/parent-api';

const DISCIPLINE = `/c/${GRACE.childId}/conduct/discipline`;

test.describe('Ma discipline', () => {
  test("s'ouvre depuis l'Accueil sur le trimestre en cours", async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`/c/${GRACE.childId}`);

    await page.locator('app-tile').getByRole('link', { name: 'Ma discipline' }).click();

    await expect(page).toHaveURL(DISCIPLINE);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ma discipline');
    await expect(page.getByRole('radio', { name: '1er trimestre' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.locator('app-discipline-summary')).toContainText(
      '2 faits mineurs · 1 fait majeur · aucun fait grave',
    );
    await expect(page.locator('app-case-card h3')).toHaveText([
      'Retards répétés',
      'Absence non justifiée',
      'Bavardage en cours de chimie',
    ]);
    await expect(page.locator('app-case-card').first()).toContainText(
      'L’école vous demande un entretien.',
    );
    await expect(
      page.getByRole('link', { name: 'Appeler le secrétariat de l’école' }),
    ).toHaveAttribute('href', 'tel:+243998877665');
  });

  test('mène du fait à l’absence liée', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(DISCIPLINE);

    await page.getByRole('link', { name: 'Voir l’absence du 16 septembre' }).click();

    await expect(page).toHaveURL(
      `/c/${GRACE.childId}/conduct/attendance?month=2026-09&date=2026-09-16`,
    );
    await expect(page.getByRole('dialog', { name: 'Mercredi 16 septembre' })).toBeVisible();
  });

  test('dit un trimestre sans fait, sans félicitation', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(DISCIPLINE);

    await page.getByRole('radio', { name: '2e trimestre' }).click();

    await expect(page).toHaveURL(/term=a1000000-0000-4000-8000-000000000002/);
    await expect(
      page.getByRole('heading', { name: 'Aucun fait consigné ce trimestre.' }),
    ).toBeVisible();
    await expect(page.locator('app-case-card')).toHaveCount(0);
  });
});
