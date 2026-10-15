import { expect, test } from '@playwright/test';
import { GRACE } from '../src/testing/bootstrap.fixture';
import { PERIOD, TERM } from '../src/testing/grades-terms.fixture';
import { COURSE, MATHS_HOMEWORK_PASSED } from '../src/testing/grades-week.fixture';
import { mockParentApi } from './support/parent-api';
import { choosePeriod } from './support/term-picker';

const COURSES = `/c/${GRACE.childId}/grades/courses`;

test.describe('Mes cours', () => {
  test("s'ouvre depuis l'Accueil sur la période en cours, tout replié", async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`/c/${GRACE.childId}`);

    await page.locator('app-tile').getByRole('link', { name: 'Mes cours' }).click();

    await expect(page).toHaveURL(COURSES);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mes cours');
    const rows = page.locator('app-course-row');
    await expect(rows).toHaveCount(8);
    await expect(rows.first()).toContainText('Mathématiques');
    await expect(rows.first()).toContainText('M. Kasongo · 2 évaluations, dernière 15/20 le 14/09');
    await expect(rows.first()).toContainText('75,0 %');
    await expect(rows.last()).toContainText('Pas encore d’évaluation');
    await expect(page.locator('[aria-expanded="true"]')).toHaveCount(0);
  });

  test('déplie un cours, ouvre une évaluation et revient au cours déplié', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(COURSES);

    await page.getByRole('button', { name: /^Mathématiques, moyenne/ }).click();
    await expect(page.getByRole('button', { name: /^Mathématiques, moyenne/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await page.getByRole('link', { name: /Devoir de Mathématiques — les fractions/ }).click();

    await expect(page).toHaveURL(
      new RegExp(`/homework/${MATHS_HOMEWORK_PASSED.evaluationId}\\?from=courses&`),
    );
    await page.locator('app-top-bar').getByRole('link', { name: 'Mes cours' }).click();

    await expect(page).toHaveURL(
      `${COURSES}?term=${TERM.first}&period=${PERIOD.first}&course=${COURSE.maths}`,
    );
    await expect(page.getByRole('button', { name: /^Mathématiques, moyenne/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  test('change de période et dit qu’elle n’est pas encore cotée', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(COURSES);

    await choosePeriod(page, '1er trimestre', '2e période');

    await expect(page).toHaveURL(`${COURSES}?term=${TERM.first}&period=${PERIOD.second}`);
    await expect(
      page.getByRole('heading', { name: 'Aucune évaluation pour la 2e période du 1er trimestre.' }),
    ).toBeVisible();
  });

  test('garde la sélection en passant à Mon bulletin', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${COURSES}?term=${TERM.first}`);

    await page.getByRole('link', { name: 'Voir Mon bulletin de cette période ›' }).click();

    await expect(page).toHaveURL(`/c/${GRACE.childId}/grades/report-card?term=${TERM.first}`);
    await expect(page.locator('app-average-header')).toContainText('Officiel');
  });
});
