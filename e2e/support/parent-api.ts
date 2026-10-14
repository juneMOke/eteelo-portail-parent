import { Page } from '@playwright/test';
import type { EvaluationList } from '../../src/app/core/api/assignments.contract';
import type { Bootstrap } from '../../src/app/core/session/bootstrap.schema';
import {
  evaluationDetailFixture,
  evaluationListFixture,
} from '../../src/testing/assessments.fixture';
import { bootstrapFixture } from '../../src/testing/bootstrap.fixture';

interface ParentApiMock {
  /** Corps du bootstrap, ou un code HTTP d'erreur. */
  bootstrap?: Bootstrap | number;
  /** Liste de Mes évaluations, ou un code HTTP d'erreur. */
  evaluations?: EvaluationList | number;
}

const EVALUATION_ROUTE = /^\/api\/v1\/parent\/children\/[^/]+\/evaluations(?:\/([^/]+))?$/;

/**
 * Simule l'API du portail parent : bootstrap, authentification, Mes évaluations ; tout le
 * reste répond 404.
 */
export async function mockParentApi(page: Page, mock: ParentApiMock = {}): Promise<void> {
  const bootstrap = mock.bootstrap ?? bootstrapFixture();
  const evaluations = mock.evaluations ?? evaluationListFixture();

  await page.route('**/api/v1/parent/**', async (route) => {
    const { pathname } = new URL(route.request().url());
    const method = route.request().method();

    if (pathname === '/api/v1/parent/bootstrap') {
      return typeof bootstrap === 'number'
        ? route.fulfill({ status: bootstrap })
        : route.fulfill({ json: bootstrap });
    }
    const evaluation = method === 'GET' ? EVALUATION_ROUTE.exec(pathname) : null;
    if (evaluation?.[1]) {
      const detail = evaluationDetailFixture(evaluation[1]);
      return detail ? route.fulfill({ json: detail }) : route.fulfill({ status: 404 });
    }
    if (evaluation) {
      return typeof evaluations === 'number'
        ? route.fulfill({ status: evaluations })
        : route.fulfill({ json: evaluations });
    }
    if (pathname.startsWith('/api/v1/parent/auth/') && method !== 'GET') {
      return route.fulfill({ json: {} });
    }
    return route.fulfill({ status: 404 });
  });
}
