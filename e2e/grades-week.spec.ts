import { expect, test } from '@playwright/test';
import { GRACE } from '../src/testing/bootstrap.fixture';
import { CHEMISTRY_PASSED, gradeWeekFixture } from '../src/testing/grades-week.fixture';
import { mockParentApi } from './support/parent-api';

const WEEK = `/c/${GRACE.childId}/grades/week`;

test.describe('Ma semaine', () => {
  test("s'ouvre depuis l'Accueil sur la semaine en cours", async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`/c/${GRACE.childId}`);

    await page.locator('app-tile').getByRole('link', { name: 'Ma semaine' }).click();

    await expect(page).toHaveURL(WEEK);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ma semaine');
    // Intitulé long au grand écran, abrégé au téléphone et à la tablette.
    await expect(page.locator('ui-week-banner .title')).toHaveText(
      /^(Semaine du 21 au 26 septembre|21 – 26 sept\.)$/,
    );
    await expect(page.locator('.summary')).toHaveText('1 évaluation · 0 notée · 1 en attente');
    await expect(page.locator('app-result-card')).toHaveCount(1);
    await expect(page.locator('app-result-card')).toContainText('Copies non encore remises');
    await expect(page.getByRole('button', { name: 'Semaine suivante' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  test('montre une semaine avec les six états, groupée par jour', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(WEEK);

    await page.getByRole('button', { name: 'Semaine précédente' }).click();

    await expect(page).toHaveURL(`${WEEK}?date=2026-09-14`);
    await expect(page.locator('.day-heading')).toHaveText([
      'Lundi 14/09',
      'Mardi 15/09',
      'Mercredi 16/09',
      'Jeudi 17/09',
      'Vendredi 18/09',
    ]);
    const cards = page.locator('app-result-card');
    await expect(cards).toHaveCount(7);
    await expect(cards.nth(0)).toContainText('Réussie');
    await expect(cards.nth(2)).toContainText('En échec');
    await expect(cards.nth(2)).toContainText('Note modifiée le 29/09');
    await expect(cards.nth(3)).toContainText('Pas de note');
    await expect(cards.nth(3)).toContainText('Absent · justifié');
    await expect(cards.nth(4)).toContainText('Juste la moyenne');
    await expect(cards.nth(5)).toContainText('0/20');
    await expect(cards.nth(5)).toContainText('Absent · non justifié');
    await expect(cards.nth(6)).toContainText('En attente');
    await expect(page.locator('ui-week-banner .current')).toHaveText(
      /^\s*(Revenir à aujourd’hui|Revenir)\s*$/,
    );
  });

  test('ouvre une fiche et revient à la même semaine', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${WEEK}?date=2026-09-14`);

    await page.getByRole('link', { name: /Interrogation de Chimie — les acides/ }).click();

    await expect(page).toHaveURL(
      `/c/${GRACE.childId}/assessments/${CHEMISTRY_PASSED.evaluationId}?from=grades-week&date=2026-09-14`,
    );
    await expect(page.locator('app-result-block')).toContainText('13,5/20');

    await page.locator('app-top-bar').getByRole('link', { name: 'Ma semaine' }).click();
    await expect(page).toHaveURL(`${WEEK}?date=2026-09-14`);
    await expect(page.locator('ui-week-banner .title')).toHaveText(
      /^(Semaine du 14 au 19 septembre|14 – 19 sept\.)$/,
    );
  });

  test('dit une semaine sans évaluation', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${WEEK}?date=2026-09-08`);

    await expect(
      page.getByRole('heading', { name: 'Aucune évaluation cette semaine' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Semaine précédente' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  test('propose de réessayer quand le réseau a manqué, et y parvient', async ({ page }) => {
    await mockParentApi(page, { grades: 503 });
    await page.goto(WEEK);

    await expect(
      page.getByRole('heading', { name: 'Impossible d’afficher les notes' }),
    ).toBeVisible();

    await page.route('**/api/v1/parent/children/*/grades/week', (route) =>
      route.fulfill({ json: gradeWeekFixture() }),
    );
    await page.getByRole('button', { name: 'Réessayer' }).click();
    await expect(page.locator('app-result-card')).toHaveCount(1);
  });
});
