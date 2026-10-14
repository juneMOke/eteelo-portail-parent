import { Page } from '@playwright/test';
import type { Bootstrap } from '../../src/app/core/session/bootstrap.schema';
import { bootstrapFixture } from '../../src/testing/bootstrap.fixture';

interface ParentApiMock {
  /** Corps du bootstrap, ou un code HTTP d'erreur. */
  bootstrap?: Bootstrap | number;
}

/** Simule l'API du portail parent : bootstrap, authentification ; tout le reste répond 404. */
export async function mockParentApi(page: Page, mock: ParentApiMock = {}): Promise<void> {
  const bootstrap = mock.bootstrap ?? bootstrapFixture();

  await page.route('**/api/v1/parent/**', async (route) => {
    const { pathname } = new URL(route.request().url());
    const method = route.request().method();

    if (pathname === '/api/v1/parent/bootstrap') {
      return typeof bootstrap === 'number'
        ? route.fulfill({ status: bootstrap })
        : route.fulfill({ json: bootstrap });
    }
    if (pathname.startsWith('/api/v1/parent/auth/') && method !== 'GET') {
      return route.fulfill({ json: {} });
    }
    return route.fulfill({ status: 404 });
  });
}
