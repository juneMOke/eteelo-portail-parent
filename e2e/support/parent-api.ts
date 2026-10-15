import { Page } from '@playwright/test';
import type { EvaluationList, HomeworkList } from '../../src/app/core/api/assignments.contract';
import type { ChildAttendance } from '../../src/app/core/api/conduct.contract';
import type { Bootstrap } from '../../src/app/core/session/bootstrap.schema';
import {
  evaluationDetailFixture,
  evaluationListFixture,
} from '../../src/testing/assessments.fixture';
import { attendanceFixture, withPendingJustification } from '../../src/testing/attendance.fixture';
import { bootstrapFixture } from '../../src/testing/bootstrap.fixture';
import { disciplineFixture } from '../../src/testing/discipline.fixture';
import { gradeCoursesFixture } from '../../src/testing/grade-courses.fixture';
import { GRADE_PERIODS } from '../../src/testing/grades-terms.fixture';
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
  /** Code HTTP d'erreur des routes de Mes notes ; par défaut, les données factices. */
  grades?: number;
  /** Le bulletin du 1er trimestre est publié : Mon bulletin s'ouvre sur lui. */
  reportCardPublished?: boolean;
  /** Présence de l'année, ou un code HTTP d'erreur. */
  attendance?: ChildAttendance | number;
  /**
   * Justification d'une absence : un code HTTP d'échec, ou la suite des codes des envois
   * successifs ; par défaut l'école la reçoit (201).
   */
  justification?: number | number[];
  /** Code HTTP d'erreur de Ma discipline ; par défaut, les données factices. */
  discipline?: number;
}

const EVALUATION_ROUTE = /^\/api\/v1\/parent\/children\/[^/]+\/evaluations(?:\/([^/]+))?$/;
const HOMEWORK_ROUTE = /^\/api\/v1\/parent\/children\/[^/]+\/homework(?:\/([^/]+))?$/;
const SUBMISSION_ROUTE = /^\/api\/v1\/parent\/children\/[^/]+\/homework\/([^/]+)\/submission$/;
const GRADES_ROUTE =
  /^\/api\/v1\/parent\/children\/[^/]+\/grades\/(week|periods|courses|report-card)$/;
const JUSTIFICATION_ROUTE =
  /^\/api\/v1\/parent\/children\/[^/]+\/attendance\/[^/]+\/justification$/;
const REPORT_CARD_PDF = /^\/api\/v1\/parent\/children\/[^/]+\/grades\/report-card\/[^/]+\/pdf$/;

/**
 * Simule l'API du portail parent : bootstrap, authentification, Mes évaluations, Mes devoirs, le
 * dépôt de copie, Mes notes et Ma conduite ; tout le reste répond 404.
 */
export async function mockParentApi(page: Page, mock: ParentApiMock = {}): Promise<void> {
  const bootstrap = mock.bootstrap ?? bootstrapFixture();
  const evaluations = mock.evaluations ?? evaluationListFixture();
  const homework = mock.homework ?? homeworkListFixture();
  let attendance = mock.attendance ?? attendanceFixture();
  const justifications = [mock.justification ?? []].flat();

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
        periodId: searchParams.get('periodId') ?? undefined,
        part: searchParams.get('part') ?? undefined,
      };
      const bodies = {
        week: () => gradeWeekFixture(searchParams.get('weekOf') ?? undefined),
        periods: () => GRADE_PERIODS,
        courses: () => gradeCoursesFixture(query),
        'report-card': () => reportCardFixture(query, mock.reportCardPublished),
      };
      return route.fulfill({ json: bodies[grades[1] as keyof typeof bodies]() });
    }
    if (method === 'GET' && pathname.endsWith('/attendance')) {
      return typeof attendance === 'number'
        ? route.fulfill({ status: attendance })
        : route.fulfill({ json: attendance });
    }
    if (method === 'GET' && pathname.endsWith('/discipline')) {
      if (mock.discipline) return route.fulfill({ status: mock.discipline });
      return route.fulfill({ json: disciplineFixture(searchParams.get('periodId') ?? undefined) });
    }
    if (method === 'POST' && JUSTIFICATION_ROUTE.test(pathname)) {
      const status = justifications.shift() ?? 201;
      if (status >= 400) return route.fulfill({ status });
      const date = pathname.split('/').at(-2) ?? '';
      if (typeof attendance !== 'number') attendance = withPendingJustification(attendance, date);
      return route.fulfill({
        status,
        json: {
          status: 'PENDING',
          reason: 'SICKNESS',
          submittedAt: new Date().toISOString(),
          decidedAt: null,
          decisionNote: null,
        },
      });
    }
    if (method === 'GET' && REPORT_CARD_PDF.test(pathname)) {
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
