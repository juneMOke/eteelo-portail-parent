import { expect, test } from '@playwright/test';
import {
  CHEMISTRY_GRADED,
  FRENCH_ABSENT,
  evaluationListFixture,
} from '../src/testing/assessments.fixture';
import { GRACE } from '../src/testing/bootstrap.fixture';
import { mockParentApi } from './support/parent-api';

const LIST = `/c/${GRACE.childId}/assessments`;

test.describe('Mes évaluations', () => {
  test("s'ouvre depuis l'Accueil sur le prochain jour qui a une épreuve", async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`/c/${GRACE.childId}`);

    await page.locator('app-tile').getByRole('link', { name: 'Mes évaluations' }).click();

    await expect(page).toHaveURL(LIST);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mes évaluations');
    await expect(page.locator('app-day-navigator .date')).toHaveText('jeudi 24 septembre 2026');
    await expect(page.locator('app-assignment-card')).toHaveCount(2);
    await expect(page.locator('app-assignment-card').first()).toContainText('À venir');
  });

  test("va de jour d'école en jour d'école et revient à aujourd'hui", async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${LIST}?date=2026-09-25`);

    await expect(page.getByText('Aucune épreuve ce jour')).toBeVisible();
    await page.getByRole('button', { name: 'Jour suivant' }).click();
    await expect(page).toHaveURL(`${LIST}?date=2026-09-28`);
    await expect(page.locator('app-day-navigator .date')).toHaveText('lundi 28 septembre 2026');

    await page.getByRole('button', { name: 'Aujourd’hui' }).click();
    await expect(page).toHaveURL(`${LIST}?date=2026-09-22`);
    await expect(page.locator('app-day-navigator .meta')).toContainText('aujourd’hui');
    await expect(page.getByRole('button', { name: 'Aujourd’hui' })).toBeHidden();
  });

  test('sort d’un jour vide vers la prochaine épreuve', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${LIST}?date=2026-09-22`);

    await page.getByRole('link', { name: /Prochaine épreuve : jeudi 24\/09/ }).click();

    await expect(page).toHaveURL(`${LIST}?date=2026-09-24`);
    await expect(page.locator('app-assignment-card')).toHaveCount(2);
  });

  test("dit qu'il n'y a pas d'école le week-end", async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${LIST}?date=2026-09-26`);

    await expect(page.getByRole('heading', { name: 'Pas d’école ce jour' })).toBeVisible();
  });

  test('ouvre une épreuve corrigée et revient au même jour', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${LIST}?date=2026-09-15`);

    await page.locator('app-assignment-card a').click();

    await expect(page).toHaveURL(`${LIST}/${CHEMISTRY_GRADED.evaluationId}?date=2026-09-15`);
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
    await expect(page).toHaveURL(`${LIST}?date=2026-09-15`);
    await expect(page.locator('app-day-navigator .date')).toHaveText('mardi 15 septembre 2026');
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
    await expect(page.locator('app-assignment-card')).toHaveCount(2);
  });

  test("affiche un jour vide quand l'enfant n'a aucune épreuve", async ({ page }) => {
    await mockParentApi(page, { evaluations: evaluationListFixture([]) });
    await page.goto(LIST);

    await expect(page.getByRole('heading', { name: 'Aucune épreuve ce jour' })).toBeVisible();
    await expect(
      page.getByText('Rien n’est prévu pour les quatre prochaines semaines.'),
    ).toBeVisible();
  });
});
