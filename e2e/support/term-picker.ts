import { Page } from '@playwright/test';

/**
 * Choisit une période dans ③, quelle que soit la largeur : pilules en ligne au grand écran,
 * deux menus déroulants empilés au téléphone et à la tablette.
 */
export async function choosePeriod(page: Page, term: string, period: string): Promise<void> {
  const picker = page.locator('app-term-picker');
  // isVisible n'attend pas : la page doit d'abord avoir reçu ses données.
  await picker.waitFor();
  const inline = picker.locator('.inline');
  if (await inline.isVisible()) {
    await inline.getByRole('radio', { name: term }).click();
    await inline.getByRole('radio', { name: period, exact: true }).click();
    return;
  }
  const [termMenu, periodMenu] = [
    picker.locator('ui-filter-menu').nth(0),
    picker.locator('ui-filter-menu').nth(1),
  ];
  await termMenu.locator('.trigger').click();
  await termMenu.getByRole('option', { name: term }).click();
  await periodMenu.locator('.trigger').click();
  await periodMenu.getByRole('option', { name: period, exact: true }).click();
}
