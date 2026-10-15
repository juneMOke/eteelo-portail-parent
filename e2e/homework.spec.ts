import { expect, test } from '@playwright/test';
import { GRACE } from '../src/testing/bootstrap.fixture';
import { MATHS_GRADED, PHYSICS_DUE, homeworkListFixture } from '../src/testing/homework.fixture';
import { mockParentApi } from './support/parent-api';

const LIST = `/c/${GRACE.childId}/homework`;

test.describe('Mes devoirs', () => {
  test("s'ouvre depuis l'Accueil sur le prochain jour qui a un devoir à rendre", async ({
    page,
  }) => {
    await mockParentApi(page);
    await page.goto(`/c/${GRACE.childId}`);

    await page.locator('app-tile').getByRole('link', { name: 'Mes devoirs' }).click();

    await expect(page).toHaveURL(LIST);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mes devoirs');
    await expect(page.locator('app-day-navigator .date')).toHaveText('mercredi 23 septembre 2026');
    await expect(page.locator('app-assignment-card')).toHaveCount(2);
    await expect(page.locator('app-assignment-card').first()).toContainText('À rendre');
  });

  test('sort d’un jour vide vers le prochain devoir', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${LIST}?date=2026-09-24`);

    await page.getByRole('link', { name: /Prochain devoir : mardi 29\/09/ }).click();

    await expect(page).toHaveURL(`${LIST}?date=2026-09-29`);
    await expect(page.locator('app-assignment-card')).toHaveCount(1);
  });

  test('ouvre un devoir à rendre et dit comment le remettre', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${LIST}?date=2026-09-23`);

    await page.locator('app-assignment-card a').filter({ hasText: 'Physique' }).click();

    await expect(page).toHaveURL(`${LIST}/${PHYSICS_DUE.evaluationId}?date=2026-09-23`);
    await expect(
      page.getByRole('heading', { name: 'Devoir de Physique — la vitesse' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Déposer le devoir' })).toBeVisible();
    await expect(
      page.getByText('Dépôt ouvert jusqu’au mercredi 23/09/2026, avant 18:00.'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /SE-Physique/ })).toHaveAttribute(
      'href',
      /\/subject$/,
    );
  });

  test('dépose une copie : aperçu, envoi, puis « Rendu » avec la copie', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${LIST}/${PHYSICS_DUE.evaluationId}`);

    await page.locator('ui-file-upload input[type=file]').setInputFiles({
      name: 'copie-physique.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7'),
    });
    await expect(page.locator('ui-file-upload')).toContainText('copie-physique.pdf');
    await page.getByRole('button', { name: 'Envoyer' }).click();

    await expect(page.getByRole('status').filter({ hasText: 'Copie reçue' })).toBeVisible();
    await expect(page.locator('app-identity-banner')).toContainText('Rendu');
    await expect(page.getByRole('link', { name: 'Consulter copie-physique.pdf' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Remplacer la copie' })).toBeVisible();
  });

  test('garde le fichier et propose de réessayer quand l’envoi échoue', async ({ page }) => {
    await mockParentApi(page, { submission: 503 });
    await page.goto(`${LIST}/${PHYSICS_DUE.evaluationId}`);

    await page.locator('ui-file-upload input[type=file]').setInputFiles({
      name: 'page-1.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('jpeg'),
    });
    await page.getByRole('button', { name: 'Envoyer' }).click();

    await expect(page.getByRole('alert')).toHaveText('L’envoi n’a pas abouti.');
    await expect(page.locator('ui-file-upload')).toContainText('page-1.jpg');
    await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible();
    await expect(page.locator('app-identity-banner')).toContainText('À rendre');
  });

  test('refuse avant l’envoi un fichier au mauvais format', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${LIST}/${PHYSICS_DUE.evaluationId}`);

    await page.locator('ui-file-upload input[type=file]').setInputFiles({
      name: 'copie.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('docx'),
    });

    await expect(page.getByRole('alert')).toHaveText('Format accepté : PDF ou photo.');
    await expect(page.getByRole('button', { name: 'Envoyer' })).toHaveCount(0);
  });

  test('ouvre un devoir corrigé et revient au même jour', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${LIST}?date=2026-09-14`);

    await page.locator('app-assignment-card a').click();

    await expect(page).toHaveURL(`${LIST}/${MATHS_GRADED.evaluationId}?date=2026-09-14`);
    await expect(page.locator('app-result-block')).toContainText('15/20');
    await expect(page.getByRole('link', { name: /CE-Mathematiques/ })).toHaveAttribute(
      'href',
      /\/answer-key$/,
    );

    await page.locator('app-top-bar').getByRole('link', { name: 'Mes devoirs' }).click();
    await expect(page).toHaveURL(`${LIST}?date=2026-09-14`);
    await expect(page.locator('app-day-navigator .date')).toHaveText('lundi 14 septembre 2026');
  });

  test('dit un devoir introuvable', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`${LIST}/00000000-0000-4000-8000-000000000000`);

    await expect(page.getByRole('heading', { name: 'Devoir introuvable' })).toBeVisible();
  });

  test('propose de réessayer quand le réseau a manqué, et y parvient', async ({ page }) => {
    await mockParentApi(page, { homework: 503 });
    await page.goto(LIST);

    await expect(
      page.getByRole('heading', { name: 'Impossible d’afficher les devoirs' }),
    ).toBeVisible();

    // Le réseau revient : la route ajoutée en dernier l'emporte sur la simulation.
    await page.route('**/api/v1/parent/children/*/homework', (route) =>
      route.fulfill({ json: homeworkListFixture() }),
    );
    await page.getByRole('button', { name: 'Réessayer' }).click();
    await expect(page.locator('app-assignment-card')).toHaveCount(2);
  });

  test("affiche un jour vide quand l'enfant n'a aucun devoir", async ({ page }) => {
    await mockParentApi(page, { homework: homeworkListFixture([]) });
    await page.goto(LIST);

    await expect(
      page.getByRole('heading', { name: 'Aucun devoir à rendre ce jour' }),
    ).toBeVisible();
    await expect(
      page.getByText('Rien n’est prévu pour les quatre prochaines semaines.'),
    ).toBeVisible();
  });
});
