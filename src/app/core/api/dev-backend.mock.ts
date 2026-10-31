import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { announcementsFixture, readResultFixture } from '../../../testing/announcements.fixture';
import {
  evaluationDetailFixture,
  evaluationListFixture,
} from '../../../testing/assessments.fixture';
import {
  attendanceFixture,
  attendanceRangeFixture,
  withPendingJustification,
} from '../../../testing/attendance.fixture';
import { bootstrapFixture } from '../../../testing/bootstrap.fixture';
import { disciplineFixture } from '../../../testing/discipline.fixture';
import {
  ACADEMIC_YEARS,
  PDF_BODY,
  feesFixture,
  paymentsFixture,
} from '../../../testing/finance.fixture';
import { gradeCoursesFixture } from '../../../testing/grade-courses.fixture';
import { GRADE_PERIODS } from '../../../testing/grades-terms.fixture';
import { gradeWeekFixture } from '../../../testing/grades-week.fixture';
import {
  homeworkDetailFixture,
  homeworkListFixture,
  submittedHomeworkFixture,
} from '../../../testing/homework.fixture';
import { reportCardFixture } from '../../../testing/report-card.fixture';
import { timetableFixture } from '../../../testing/timetable.fixture';
import { PARENT_API, PARENT_AUTH_API, PARENT_CHILDREN_API } from './parent-api';

const identity = { ...bootstrapFixture().parent, fullName: 'Léonie Kabila' };
const EVALUATION_ROUTE = new RegExp(`^${PARENT_CHILDREN_API}/[^/]+/evaluations(?:/([^/?]+))?$`);
const HOMEWORK_ROUTE = new RegExp(`^${PARENT_CHILDREN_API}/[^/]+/homework(?:/([^/?]+))?$`);
const SUBMISSION_ROUTE = new RegExp(`^${PARENT_CHILDREN_API}/[^/]+/homework/([^/?]+)/submission$`);
const GRADES_ROUTE = new RegExp(
  `^${PARENT_CHILDREN_API}/[^/]+/grades/(week|periods|courses|report-card)$`,
);
const TIMETABLE_ROUTE = new RegExp(`^${PARENT_CHILDREN_API}/([^/]+)/timetable$`);
/** Présence servie, mise à jour par les justifications reçues pendant la session de développement. */
let attendance = attendanceFixture();
const CONDUCT_ROUTE = new RegExp(`^${PARENT_CHILDREN_API}/[^/]+/(attendance|discipline)$`);
const FINANCE_ROUTE = new RegExp(`^${PARENT_CHILDREN_API}/[^/]+/(fees|payments|academic-years)$`);
const DOCUMENT_ROUTE = new RegExp(
  `^${PARENT_CHILDREN_API}/[^/]+/(payments/[^/]+/receipt|statement)$`,
);
/** Annonces servies, mises à jour par les lectures de la session de développement. */
let announcements = announcementsFixture();
const ANNOUNCEMENTS_ROUTE = new RegExp(`^${PARENT_CHILDREN_API}/[^/]+/announcements$`);
const ANNOUNCEMENT_READ_ROUTE = new RegExp(
  `^${PARENT_CHILDREN_API}/[^/]+/announcements/([^/]+)/read$`,
);
const JUSTIFICATION_ROUTE = new RegExp(
  `^${PARENT_CHILDREN_API}/[^/]+/attendance/[^/]+/justification$`,
);

/** Toute l'année, ou la plage demandée (la semaine de Ma présence). */
function attendanceOrRange(from: string | null, to: string | null) {
  return from && to ? attendanceRangeFixture(attendance, { from, to }) : attendance;
}

/** Serveur factice : répond aux routes du portail parent sans quitter le navigateur. */
const mockBackend: HttpInterceptorFn = (req, next) => {
  const ok = (body: unknown = null) => of(new HttpResponse({ status: 200, body }));

  if (req.method === 'GET' && req.url === `${PARENT_API}/bootstrap`) return ok(bootstrapFixture());
  if (req.method === 'GET' && req.url === `${PARENT_AUTH_API}/me`) return ok(identity);
  if (req.method === 'POST' && req.url === `${PARENT_AUTH_API}/magic-link`) return ok();
  if (req.method === 'POST' && req.url === `${PARENT_AUTH_API}/session`) return ok(identity);
  if (req.method === 'DELETE' && req.url === `${PARENT_AUTH_API}/session`) return ok();
  if (req.url === `${PARENT_API}/push-subscriptions` && ['PUT', 'DELETE'].includes(req.method)) {
    return of(new HttpResponse({ status: 204 }));
  }
  const evaluation = req.method === 'GET' ? EVALUATION_ROUTE.exec(req.url) : null;
  if (evaluation) {
    const body = evaluation[1] ? evaluationDetailFixture(evaluation[1]) : evaluationListFixture();
    if (body) return ok(body);
  }
  const homework = req.method === 'GET' ? HOMEWORK_ROUTE.exec(req.url) : null;
  if (homework) {
    const body = homework[1] ? homeworkDetailFixture(homework[1]) : homeworkListFixture();
    if (body) return ok(body);
  }
  const grades = req.method === 'GET' ? GRADES_ROUTE.exec(req.url) : null;
  if (grades) {
    const query = {
      periodId: req.params.get('periodId') ?? undefined,
      part: req.params.get('part') ?? undefined,
    };
    if (grades[1] === 'week') return ok(gradeWeekFixture(req.params.get('weekOf') ?? undefined));
    if (grades[1] === 'periods') return ok(GRADE_PERIODS);
    return ok(grades[1] === 'courses' ? gradeCoursesFixture(query) : reportCardFixture(query));
  }
  const timetable = req.method === 'GET' ? TIMETABLE_ROUTE.exec(req.url) : null;
  if (timetable) {
    const body = timetableFixture(req.params.get('week') ?? undefined, timetable[1]);
    if (body) return ok(body);
    return throwError(() => new HttpErrorResponse({ status: 400, url: req.url }));
  }
  const conduct = req.method === 'GET' ? CONDUCT_ROUTE.exec(req.url) : null;
  if (conduct) {
    return ok(
      conduct[1] === 'attendance'
        ? attendanceOrRange(req.params.get('from'), req.params.get('to'))
        : disciplineFixture(req.params.get('periodId') ?? undefined),
    );
  }
  if (req.method === 'POST' && JUSTIFICATION_ROUTE.test(req.url) && req.body instanceof FormData) {
    attendance = withPendingJustification(attendance, req.url.split('/').at(-2) ?? '');
    return of(
      new HttpResponse({
        status: 201,
        body: {
          status: 'PENDING',
          reason: req.body.get('reason'),
          submittedAt: new Date().toISOString(),
          decidedAt: null,
          decisionNote: null,
        },
      }),
    );
  }
  const finance = req.method === 'GET' ? FINANCE_ROUTE.exec(req.url) : null;
  if (finance) {
    const year = req.params.get('academicYearId') ?? undefined;
    if (finance[1] === 'fees') return ok(feesFixture());
    return ok(finance[1] === 'payments' ? paymentsFixture(year) : ACADEMIC_YEARS);
  }
  if (req.method === 'GET' && ANNOUNCEMENTS_ROUTE.test(req.url)) return ok(announcements);
  const read = req.method === 'POST' ? ANNOUNCEMENT_READ_ROUTE.exec(req.url) : null;
  if (read) {
    const next = readResultFixture(announcements, read[1], new Date().toISOString());
    if (next) {
      announcements = next.list;
      return ok(next.result);
    }
  }
  if (DOCUMENT_ROUTE.test(req.url)) {
    return ok(new Blob([PDF_BODY], { type: 'application/pdf' }));
  }
  const submission = req.method === 'POST' ? SUBMISSION_ROUTE.exec(req.url) : null;
  if (submission && req.body instanceof FormData) {
    const files = req.body.getAll('files').filter((part): part is File => part instanceof File);
    const body = submittedHomeworkFixture(submission[1], files, new Date().toISOString());
    if (body) return ok(body);
  }
  if (req.url.startsWith(PARENT_API)) {
    return throwError(() => new HttpErrorResponse({ status: 404, url: req.url }));
  }
  return next(req);
};

export const DEV_BACKEND_INTERCEPTORS: HttpInterceptorFn[] = [mockBackend];
