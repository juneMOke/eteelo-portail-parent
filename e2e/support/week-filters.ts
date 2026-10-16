import { Page, TestInfo } from '@playwright/test';

/**
 * Choisit une option d'un filtre de la vue semaine : pastille dans le bandeau au grand écran,
 * menu déroulant sous le bandeau au téléphone et à la tablette.
 */
export async function chooseFilter(
  page: Page,
  testInfo: TestInfo,
  group: 'Filtrer par jour' | 'Filtrer par statut',
  option: RegExp,
): Promise<void> {
  if (testInfo.project.name === 'desktop') {
    await page
      .getByRole('radiogroup', { name: group })
      .getByRole('radio', { name: option })
      .click();
    return;
  }
  await page.getByRole('button', { name: new RegExp(`^${group}`) }).click();
  await page.getByRole('listbox', { name: group }).getByRole('option', { name: option }).click();
}
