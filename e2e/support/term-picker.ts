import { Page } from '@playwright/test';

/**
 * Choisit une période dans ③, quelle que soit la largeur : pilules en ligne à partir de 600 px,
 * ligne compacte et feuille de choix au téléphone.
 */
export async function choosePeriod(page: Page, term: string, period: string): Promise<void> {
  const picker = page.locator('app-term-picker');
  const compact = picker.locator('.compact');
  // isVisible n'attend pas : la page doit d'abord avoir reçu ses données.
  await picker.waitFor();
  if (await compact.isVisible()) {
    await compact.click();
    const sheet = page.getByRole('dialog', { name: 'Choisir la période' });
    await sheet.getByRole('radio', { name: term }).click();
    await sheet.getByRole('radio', { name: period, exact: true }).click();
    return;
  }
  const inline = picker.locator('.inline');
  await inline.getByRole('radio', { name: term }).click();
  await inline.getByRole('radio', { name: period, exact: true }).click();
}
