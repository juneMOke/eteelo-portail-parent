import { expect, test } from '@playwright/test';
import {
  CHEMISTRY_GRADED,
  FRENCH_ABSENT,
  evaluationListFixture,
} from '../src/testing/assessments.fixture';
import { GRACE } from '../src/testing/bootstrap.fixture';
import { mockParentApi } from './support/parent-api';
import { chooseFilter } from './support/week-filters';

const LIST = `/c/${GRACE.childId}/assessments`;

test.describe('Mes évaluations', () => {
  test("s'ouvre depuis l'Accueil sur la semaine en cours", async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`/c/${GRACE.childId}`);

    await page.locator('app-tile').getByRole('link', { name: 'Mes évaluations' }).click();

    await expect(page).toHaveURL(LIST);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mes évaluations');
    await expect(page.locator('app-week-banner .relative')).toHaveText(/cette sem/i);
    await expect(page.locator('app-assignment-card')).toHaveCount(3);
    await expect(page.locator('app-assignment-card').last()).toContainText('À venir');
  });

  test('change de semaine et revient à cette semaine', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(LIST);

    await page.getByRole('button', { name: 'Semaine suivante' }).click();
    await expect(page).toHaveURL(`${LIST}?week=2026-09-28`);
    await expect(page.locator('app-assignment-card')).toHaveCount(1);
    await expect(page.locator('app-assignment-card')).toContainText('Anglais');

    await page.getByRole('button', { name: /^Revenir/ }).click();
    await expect(page).toHaveURL(LIST);
    await expect(page.locator('app-assignment-card')).toHaveCount(3);
  });

  test('filtre les absences de la semaine', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${LIST}?week=2026-09-14`);

    await chooseFilter(page, 'Filtrer par statut', /^Absences/);

    await expect(page).toHaveURL(`${LIST}?week=2026-09-14&status=ABSENT`);
    await expect(page.locator('app-assignment-card')).toHaveCount(1);
    await expect(page.locator('app-assignment-card')).toContainText('Absent à l’épreuve');
  });

  test('ouvre une épreuve corrigée et revient à la même semaine, au même filtre', async ({
    page,
  }) => {
    await mockParentApi(page);
    await page.goto(`${LIST}?week=2026-09-14&status=GRADED`);

    await page.locator('app-assignment-card a').filter({ hasText: 'Chimie' }).click();

    await expect(page).toHaveURL(
      `${LIST}/${CHEMISTRY_GRADED.evaluationId}?week=2026-09-14&status=GRADED`,
    );
    await expect(
      page.getByRole('heading', { name: 'Interrogation de Chimie — les acides' }),
    ).toBeVisible();
    await expect(page.locator('app-result-block')).toContainText('13,5/20');
    await expect(page.locator('app-result-block')).toContainText('moyenne de la classe 11,5/20');
    await expect(page.getByText('Bonne maîtrise du pH.', { exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: /Consulter CE-Chimie/ })).toHaveAttribute(
      'href',
      /\/answer-key$/,
    );

    await page.locator('app-top-bar').getByRole('link', { name: 'Mes évaluations' }).click();
    await expect(page).toHaveURL(`${LIST}?week=2026-09-14&status=GRADED`);
    await expect(page.locator('app-assignment-card')).toHaveCount(2);
  });

  test('donne la marche à suivre après une absence', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${LIST}/${FRENCH_ABSENT.evaluationId}`);

    await expect(page.getByRole('heading', { name: 'Ce qu’il reste à faire' })).toBeVisible();
    await expect(page.getByText('Épreuve à rattraper.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Voir la présence' })).toBeVisible();
  });

  test('dit une évaluation introuvable', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${LIST}/00000000-0000-4000-8000-000000000000`);

    await expect(page.getByRole('heading', { name: 'Évaluation introuvable' })).toBeVisible();
  });

  test('propose de réessayer quand le réseau a manqué, et y parvient', async ({ page }) => {
    await mockParentApi(page, { evaluations: 503 });
    await page.goto(LIST);

    await expect(
      page.getByRole('heading', { name: 'Impossible d’afficher les évaluations' }),
    ).toBeVisible();

    // Le réseau revient : la route ajoutée en dernier l'emporte sur la simulation.
    await page.route('**/api/v1/parent/children/*/evaluations', (route) =>
      route.fulfill({ json: evaluationListFixture() }),
    );
    await page.getByRole('button', { name: 'Réessayer' }).click();
    await expect(page.locator('app-assignment-card')).toHaveCount(3);
  });

  test("dit une semaine vide quand l'enfant n'a aucune épreuve", async ({ page }) => {
    await mockParentApi(page, { evaluations: evaluationListFixture([]) });
    await page.goto(LIST);

    await expect(
      page.getByRole('heading', { name: 'Aucune évaluation cette semaine' }),
    ).toBeVisible();
    await expect(page.getByText('Utilisez les flèches pour changer de semaine.')).toBeVisible();
  });
});
