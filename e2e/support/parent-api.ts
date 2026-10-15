import { Page } from '@playwright/test';
import type { EvaluationList, HomeworkList } from '../../src/app/core/api/assignments.contract';
import type { Bootstrap } from '../../src/app/core/session/bootstrap.schema';
import {
  evaluationDetailFixture,
  evaluationListFixture,
} from '../../src/testing/assessments.fixture';
import { bootstrapFixture } from '../../src/testing/bootstrap.fixture';
import { gradeCoursesFixture } from '../../src/testing/grade-courses.fixture';
import { gradeWeekFixture } from '../../src/testing/grades-week.fixture';
import {
  homeworkDetailFixture,
  homeworkListFixture,
  submittedHomeworkFixture,
} from '../../src/testing/homework.fixture';
import { reportCardFixture } from '../../src/testing/report-card.fixture';

interface ParentApiMock {
  /** Corps du bootstrap, ou un code HTTP d'erreur. */
  bootstrap?: Bootstrap | number;
  /** Liste de Mes évaluations, ou un code HTTP d'erreur. */
  evaluations?: EvaluationList | number;
  /** Liste de Mes devoirs, ou un code HTTP d'erreur. */
  homework?: HomeworkList | number;
  /** Code HTTP d'échec du dépôt de copie ; par défaut le dépôt réussit. */
  submission?: number;
  /** Code HTTP d'erreur des trois routes de Mes notes ; par défaut, les données factices. */
  grades?: number;
}

const EVALUATION_ROUTE = /^\/api\/v1\/parent\/children\/[^/]+\/evaluations(?:\/([^/]+))?$/;
const HOMEWORK_ROUTE = /^\/api\/v1\/parent\/children\/[^/]+\/homework(?:\/([^/]+))?$/;
const SUBMISSION_ROUTE = /^\/api\/v1\/parent\/children\/[^/]+\/homework\/([^/]+)\/submission$/;
const GRADES_ROUTE = /^\/api\/v1\/parent\/children\/[^/]+\/grades\/(week|courses|report-card)$/;
const REPORT_CARD_DOCUMENT = /^\/api\/v1\/parent\/children\/[^/]+\/report-cards\/[^/]+\/document$/;

/**
 * Simule l'API du portail parent : bootstrap, authentification, Mes évaluations, Mes devoirs, le
 * dépôt de copie et Mes notes ; tout le reste répond 404.
 */
export async function mockParentApi(page: Page, mock: ParentApiMock = {}): Promise<void> {
  const bootstrap = mock.bootstrap ?? bootstrapFixture();
  const evaluations = mock.evaluations ?? evaluationListFixture();
  const homework = mock.homework ?? homeworkListFixture();

  await page.route('**/api/v1/parent/**', async (route) => {
    const { pathname, searchParams } = new URL(route.request().url());
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
    const homeworkMatch = method === 'GET' ? HOMEWORK_ROUTE.exec(pathname) : null;
    if (homeworkMatch?.[1]) {
      const detail = homeworkDetailFixture(homeworkMatch[1]);
      return detail ? route.fulfill({ json: detail }) : route.fulfill({ status: 404 });
    }
    if (homeworkMatch) {
      return typeof homework === 'number'
        ? route.fulfill({ status: homework })
        : route.fulfill({ json: homework });
    }
    const grades = method === 'GET' ? GRADES_ROUTE.exec(pathname) : null;
    if (grades) {
      if (mock.grades) return route.fulfill({ status: mock.grades });
      const query = {
        termId: searchParams.get('termId') ?? undefined,
        periodId: searchParams.get('periodId') ?? undefined,
      };
      const body =
        grades[1] === 'week'
          ? gradeWeekFixture(searchParams.get('date') ?? undefined)
          : grades[1] === 'courses'
            ? gradeCoursesFixture(query)
            : reportCardFixture(query);
      return route.fulfill({ json: body });
    }
    if (method === 'GET' && REPORT_CARD_DOCUMENT.test(pathname)) {
      return route.fulfill({ contentType: 'application/pdf', body: '%PDF-1.4\n' });
    }
    const submission = method === 'POST' ? SUBMISSION_ROUTE.exec(pathname) : null;
    if (submission) {
      if (mock.submission) return route.fulfill({ status: mock.submission });
      // Les noms des parties `files`, dans l'ordre ; le poids et le type ne sont pas relus.
      const body = route.request().postDataBuffer()?.toString('latin1') ?? '';
      const files = [...body.matchAll(/name="files"; filename="([^"]+)"/g)].map(([, name]) => ({
        name,
        type: name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        size: 1_200_000,
      }));
      const detail = submittedHomeworkFixture(submission[1], files);
      return detail ? route.fulfill({ status: 201, json: detail }) : route.fulfill({ status: 404 });
    }
    if (pathname.startsWith('/api/v1/parent/auth/') && method !== 'GET') {
      return route.fulfill({ json: {} });
    }
    return route.fulfill({ status: 404 });
  });
}
