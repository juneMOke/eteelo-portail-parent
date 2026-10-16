import { expect, test } from '@playwright/test';
import { emptyAttendanceFixture } from '../src/testing/attendance.fixture';
import { GRACE } from '../src/testing/bootstrap.fixture';
import { mockParentApi } from './support/parent-api';

const ATTENDANCE = `/c/${GRACE.childId}/conduct/attendance`;

test.describe('Ma présence', () => {
  test("s'ouvre depuis l'Accueil sur le mois en cours, ce qui attend le parent en haut", async ({
    page,
  }) => {
    await mockParentApi(page);
    await page.goto(`/c/${GRACE.childId}`);

    await page.locator('app-tile').getByRole('link', { name: 'Ma présence' }).click();

    await expect(page).toHaveURL(ATTENDANCE);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ma présence');
    await expect(page.locator('app-pending-absences .day')).toHaveText([
      'Mardi 29/09',
      'Vendredi 02/10',
    ]);
    await expect(page.locator('app-attendance-header .days')).toHaveText('20 jours présents sur 25');
    await expect(page.locator('app-month-navigator .title')).toHaveText('Octobre 2026');
    await expect(page.getByRole('button', { name: 'Mois suivant' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  test('montre la semaine jour par jour, puis le mois', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(ATTENDANCE);

    await expect(page.locator('.scale-title')).toHaveText([
      'La semaine jour par jour',
      'Le mois vue calendrier',
    ]);
    await expect(page.locator('app-week-days .word').first()).toHaveText(
      'Absent · justification envoyée',
    );

    await page.getByRole('button', { name: 'Semaine précédente' }).click();
    await page.getByRole('button', { name: 'Semaine précédente' }).click();
    await page.getByRole('button', { name: 'Semaine précédente' }).click();

    await expect(page).toHaveURL(`${ATTENDANCE}?week=2026-09-14`);
    await expect(page.locator('app-week-indicators dd')).toHaveText(['80 %', '0', '1', '2']);
    await expect(page.locator('app-week-indicators .pill')).toHaveText('4 jours présents sur 5 · 2 retards');
    await expect(page.locator('app-month-navigator .title')).toHaveText('Octobre 2026');
  });

  test('montre un mois, ses retards et la fiche d’un jour', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(ATTENDANCE);

    await page.getByRole('button', { name: 'Mois précédent' }).click();

    await expect(page).toHaveURL(`${ATTENDANCE}?month=2026-09`);
    await expect(page.locator('app-month-navigator .meta')).toHaveText(
      '22 jours d’école · 3 absences · 3 retards',
    );
    await expect(page.locator('app-absence-list li')).toHaveCount(6);
    await expect(page.locator('app-absence-list')).toContainText('En retard · arrivé à 7 h 52');

    await page
      .getByRole('button', { name: 'Mercredi 16 septembre, absent, non justifié.' })
      .click();
    const sheet = page.getByRole('dialog', { name: 'Mercredi 16 septembre' });
    await expect(sheet).toContainText('Le délai de justification est passé.');

    await sheet.getByRole('link', { name: 'Suite : avertissement écrit' }).click();
    await expect(page).toHaveURL(/conduct\/discipline\?term=.+&case=/);
    await expect(page.locator('app-case-card h3').first()).toHaveText('Absence non justifiée');
  });

  test('justifie une absence : la ligne passe en attente de l’école', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(ATTENDANCE);

    await page.getByRole('button', { name: 'Justifier l’absence du Vendredi 02/10' }).click();
    const sheet = page.getByRole('dialog', { name: 'Justifier l’absence du vendredi 02/10' });
    await sheet.getByRole('radio', { name: 'Maladie' }).click();
    await sheet.getByRole('textbox').fill('Fièvre, certificat à venir');
    await sheet.getByRole('button', { name: 'Envoyer' }).click();

    await expect(sheet).toBeHidden();
    await expect(page.locator('app-pending-absences li').nth(1)).toContainText(
      'Justification envoyée · en attente de l’école',
    );
  });

  test('garde la saisie après une coupure et la renvoie', async ({ page }) => {
    await mockParentApi(page, { justification: [503, 201] });
    await page.goto(ATTENDANCE);

    await page.getByRole('button', { name: 'Justifier l’absence du Vendredi 02/10' }).click();
    const sheet = page.getByRole('dialog', { name: 'Justifier l’absence du vendredi 02/10' });
    await sheet.getByRole('radio', { name: 'Transport' }).click();
    await sheet.getByRole('button', { name: 'Envoyer' }).click();

    await expect(sheet.getByRole('alert')).toHaveText('L’envoi n’a pas abouti.');
    await expect(sheet.getByRole('radio', { name: 'Transport' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await sheet.getByRole('button', { name: 'Réessayer' }).click();
    await expect(sheet).toBeHidden();
  });

  test('dit quand la présence commence, en début d’année', async ({ page }) => {
    await mockParentApi(page, { attendance: emptyAttendanceFixture() });
    await page.goto(ATTENDANCE);

    await expect(
      page.getByText('La présence est enregistrée à partir du mardi 1 septembre.'),
    ).toBeVisible();
    await expect(page.locator('app-month-calendar')).toHaveCount(0);
    await expect(page.locator('app-week-days')).toHaveCount(0);
  });
});
