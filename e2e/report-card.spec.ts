import { expect, test } from '@playwright/test';
import { GRACE } from '../src/testing/bootstrap.fixture';
import { TERM } from '../src/testing/grades-terms.fixture';
import { COURSE } from '../src/testing/grades-week.fixture';
import { mockParentApi } from './support/parent-api';
import { choosePeriod } from './support/term-picker';

const REPORT_CARD = `/c/${GRACE.childId}/grades/report-card`;

test.describe('Mon bulletin', () => {
  test("s'ouvre depuis l'Accueil sur une moyenne provisoire, sans rang", async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`/c/${GRACE.childId}`);

    await page.locator('app-tile').getByRole('link', { name: 'Mon bulletin' }).click();

    await expect(page).toHaveURL(REPORT_CARD);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mon bulletin');
    const header = page.locator('app-average-header');
    await expect(header).toContainText('Provisoire');
    await expect(header).toContainText('52,9 %');
    await expect(header).toContainText('Calculée sur 6 notes. Peut différer du bulletin officiel.');
    await expect(header).not.toContainText('Rang');
    await expect(page.locator('app-report-line')).toHaveCount(8);
    await expect(page.locator('app-report-document')).toContainText('après sa publication');
  });

  test('montre le bulletin officiel du trimestre, son rang et son PDF', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(REPORT_CARD);

    await choosePeriod(page, '1er trimestre', 'Tout le trimestre');

    await expect(page).toHaveURL(`${REPORT_CARD}?term=${TERM.first}`);
    const header = page.locator('app-average-header');
    await expect(header).toContainText('Officiel · publié le 19/12');
    await expect(header).toContainText('Moyenne de l’année au 1er trimestre');
    await expect(header).toContainText('8e sur 32');
    await expect(page.getByRole('link', { name: 'Télécharger' })).toHaveAttribute(
      'href',
      /\/report-cards\/[^/]+\/document$/,
    );
  });

  test('ouvre Mes cours sur le cours d’une ligne', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${REPORT_CARD}?term=${TERM.first}`);

    await page.getByRole('link', { name: /^Géographie, 45,0/ }).click();

    await expect(page).toHaveURL(
      `/c/${GRACE.childId}/grades/courses?term=${TERM.first}&course=${COURSE.geography}`,
    );
    await expect(page.getByRole('button', { name: /^Géographie, moyenne/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  test('dit une période pas encore cotée', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(REPORT_CARD);

    await choosePeriod(page, '1er trimestre', '2e période');

    await expect(
      page.getByRole('heading', {
        name: 'Le bulletin de cette période sera publié par l’école en fin de période.',
      }),
    ).toBeVisible();
  });
});
