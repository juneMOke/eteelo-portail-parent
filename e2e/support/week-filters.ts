import { Page } from '@playwright/test';

/** Choisit une option d'un filtre de la vue semaine, dans son menu déroulant sous le bandeau. */
export async function chooseFilter(
  page: Page,
  group: 'Filtrer par jour' | 'Filtrer par statut',
  option: RegExp,
): Promise<void> {
  await page.getByRole('button', { name: new RegExp(`^${group}`) }).click();
  await page.getByRole('listbox', { name: group }).getByRole('option', { name: option }).click();
}
