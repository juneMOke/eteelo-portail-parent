import { expect, test } from '@playwright/test';
import { HISTORY_UPCOMING } from '../src/testing/assessments.fixture';
import { DAVID, GRACE } from '../src/testing/bootstrap.fixture';
import { mockParentApi } from './support/parent-api';

const TIMETABLE = `/c/${GRACE.childId}/timetable`;

test.describe('Mon emploi du temps', () => {
  test("s'ouvre depuis l'Accueil sur aujourd'hui, le cours en cours marqué", async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`/c/${GRACE.childId}`);

    await page.locator('app-tile').getByRole('link', { name: 'Mon emploi du temps' }).click();

    await expect(page).toHaveURL(TIMETABLE);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mon emploi du temps');
    const banner = page.locator('app-timetable-banner');
    await expect(banner.locator('.title')).toHaveText('Mardi 22 septembre 2026');
    await expect(banner.locator('.summary')).toHaveText('Aujourd’hui · 5 cours · 7 h 30 à 11 h 45');
    await expect(page.locator('app-day-schedule .count')).toHaveText('5 cours');
    await expect(page.locator('app-course-card')).toHaveCount(5);
    const now = page.locator('app-course-card.now');
    await expect(now.locator('.subject')).toHaveText('Mathématiques');
    await expect(now.locator('.now-pill')).toHaveText('En ce moment');
  });

  test("ouvre la fiche d'une épreuve et revient au même jour", async ({ page }) => {
    await mockParentApi(page);
    await page.goto(TIMETABLE);

    await page.getByRole('button', { name: 'Jeudi 24 septembre 2026' }).click();
    await expect(page).toHaveURL(`${TIMETABLE}?date=2026-09-24`);
    await expect(page.locator('app-timetable-banner .summary')).toHaveText(
      '4 cours · 7 h 30 à 11 h 45 · 2 épreuves',
    );

    await page.getByRole('link', { name: 'Examen · 2 h — voir le programme' }).click();
    await expect(page).toHaveURL(
      `/c/${GRACE.childId}/assessments/${HISTORY_UPCOMING.evaluationId}?from=timetable&date=2026-09-24`,
    );

    await page.locator('app-top-bar').getByRole('link', { name: 'Mon emploi du temps' }).click();
    await expect(page).toHaveURL(`${TIMETABLE}?date=2026-09-24`);
    await expect(page.locator('app-timetable-banner .title')).toHaveText('Jeudi 24 septembre 2026');
  });

  test('passe du vendredi au lundi suivant, puis revient à aujourd’hui', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${TIMETABLE}?date=2026-09-25`);

    await page.getByRole('button', { name: 'Jour suivant' }).click();

    await expect(page).toHaveURL(`${TIMETABLE}?date=2026-09-28`);
    await expect(page.locator('app-timetable-banner .title')).toHaveText('Lundi 28 septembre 2026');
    await page.getByRole('button', { name: 'Revenir à aujourd’hui' }).click();
    await expect(page).toHaveURL(TIMETABLE);
    await expect(page.locator('app-timetable-banner .title')).toHaveText('Mardi 22 septembre 2026');
  });

  test('dit un jour sans cours et mène au prochain jour d’école', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${TIMETABLE}?date=2026-10-02`);

    await expect(page.locator('app-day-schedule .closed-title')).toHaveText('Aucun cours ce jour');
    await expect(page.locator('app-day-schedule .count')).toHaveText('aucun cours');
    await page.getByRole('link', { name: 'Prochain jour d’école : lundi 05/10 ›' }).click();

    await expect(page).toHaveURL(`${TIMETABLE}?date=2026-10-05`);
    await expect(page.locator('app-course-card')).toHaveCount(4);
  });

  test('dit un emploi du temps pas encore publié', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`/c/${DAVID.childId}/timetable`);

    await expect(page.locator('app-day-schedule .closed-title')).toHaveText(
      'Emploi du temps pas encore publié',
    );
    await expect(page.locator('app-course-card')).toHaveCount(0);
  });

  test('montre la semaine en colonnes au bureau seulement', async ({ page }, testInfo) => {
    await mockParentApi(page);
    await page.goto(TIMETABLE);
    const views = page.getByRole('radiogroup', { name: 'Affichage' });

    if (testInfo.project.name !== 'desktop') {
      await expect(views).toBeHidden();
      return;
    }
    await views.getByRole('radio', { name: 'Semaine' }).click();
    await expect(page).toHaveURL(`${TIMETABLE}?view=week`);
    await expect(page.locator('app-timetable-banner .title')).toHaveText(
      'Semaine du 21 au 25 septembre',
    );
    await expect(page.locator('app-week-schedule .column')).toHaveCount(5);

    await page.getByRole('link', { name: 'Voir la journée' }).nth(3).click();
    await expect(page).toHaveURL(`${TIMETABLE}?date=2026-09-24`);
    await expect(page.locator('app-day-schedule')).toBeVisible();
  });

  test('propose de réessayer quand l’emploi du temps ne se charge pas', async ({ page }) => {
    await mockParentApi(page, { timetable: 500 });
    await page.goto(TIMETABLE);

    await expect(page.getByText('Impossible d’afficher l’emploi du temps')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible();
  });
});
