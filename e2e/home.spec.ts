import { expect, test } from '@playwright/test';
import { DAVID, GRACE, bootstrapFixture } from '../src/testing/bootstrap.fixture';
import { mockParentApi } from './support/parent-api';

test.describe('Accueil', () => {
  test('affiche la salutation et les cinq groupes du premier enfant', async ({ page }) => {
    await mockParentApi(page);
    await page.goto('/');

    await expect(page).toHaveURL(`/c/${GRACE.childId}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Accueil');
    await expect(page.getByText('Mbote, Mme Kabila')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2 })).toHaveText([
      'Préparer ma semaine',
      'Mes notes',
      'Ma conduite',
      'Mes finances',
      'Ma communication',
    ]);
    await expect(page.locator('app-tile a')).toHaveCount(13);
  });

  test('montre le menu latéral au bureau seulement', async ({ page }, testInfo) => {
    await mockParentApi(page);
    await page.goto('/');

    const sideNav = page.locator('app-side-nav');
    if (testInfo.project.name === 'desktop') await expect(sideNav).toBeVisible();
    else await expect(sideNav).toBeHidden();
  });

  test('ouvre une page depuis sa tuile et revient à l’Accueil', async ({ page }) => {
    await mockParentApi(page);
    await page.goto('/');

    await page.locator('app-tile').getByRole('link', { name: 'Mon emploi du temps' }).click();
    await expect(page).toHaveURL(`/c/${GRACE.childId}/timetable`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mon emploi du temps');
    await expect(page.getByText('Bientôt disponible')).toBeVisible();

    await page.locator('app-top-bar').getByRole('link', { name: 'Accueil' }).click();
    await expect(page).toHaveURL(`/c/${GRACE.childId}`);
  });

  test('change d’enfant en deux touches, sans redessiner la barre', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`/c/${GRACE.childId}`);
    const topBar = await page.locator('app-top-bar').elementHandle();

    await page.getByRole('button', { name: /Enfant affiché : Grâce/ }).click();
    const sheet = page.getByRole('dialog', { name: 'Mes enfants' });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('radio', { name: /David/ }).click();

    await expect(page).toHaveURL(`/c/${DAVID.childId}`);
    await expect(sheet).toBeHidden();
    await expect(page.getByText(/· David$/)).toBeVisible();
    expect(await topBar?.evaluate((el) => el.isConnected)).toBe(true);
  });

  test('ferme la feuille au clavier et rend le focus à la pilule', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`/c/${GRACE.childId}`);
    const pill = page.getByRole('button', { name: /Enfant affiché : Grâce/ });

    await pill.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog').getByRole('radio', { name: /Grâce/ })).toBeFocused();
    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(pill).toBeFocused();
  });

  test('atteint la dernière tuile au clavier depuis la pilule', async ({ page }) => {
    await mockParentApi(page);
    await page.goto(`/c/${GRACE.childId}`);
    const lastTile = page.locator('app-tile').getByRole('link', { name: 'Mes notifications' });

    await page.getByRole('button', { name: /Enfant affiché/ }).focus();
    for (let presses = 0; presses < 40; presses++) {
      if (await lastTile.evaluate((el) => el === document.activeElement)) break;
      await page.keyboard.press('Tab');
    }

    await expect(lastTile).toBeFocused();
  });

  test('rend la pilule inerte avec un seul enfant', async ({ page }) => {
    await mockParentApi(page, { bootstrap: bootstrapFixture([GRACE]) });
    await page.goto('/');

    await expect(page.getByRole('img', { name: 'Enfant affiché : Grâce, 5e B.' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Enfant affiché/ })).toHaveCount(0);
  });

  test('renvoie un enfant inconnu vers le premier enfant', async ({ page }) => {
    await mockParentApi(page);
    await page.goto('/c/00000000-0000-4000-8000-000000000000/finance/fees');

    await expect(page).toHaveURL(`/c/${GRACE.childId}`);
  });
});

test.describe('États hors Accueil', () => {
  test('affiche l’écran dédié quand aucun élève n’est rattaché', async ({ page }) => {
    await mockParentApi(page, { bootstrap: bootstrapFixture([]) });
    await page.goto('/');

    await expect(page).toHaveURL('/no-children');
    await expect(
      page.getByRole('heading', { name: 'Aucun élève n’est rattaché à ce compte' }),
    ).toBeVisible();
  });

  test('renvoie vers la connexion quand la session a expiré', async ({ page }) => {
    await mockParentApi(page, { bootstrap: 401 });
    await page.goto(`/c/${GRACE.childId}`);

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Portail parent' })).toBeVisible();
  });
});
