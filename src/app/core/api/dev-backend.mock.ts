import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import {
  evaluationDetailFixture,
  evaluationListFixture,
} from '../../../testing/assessments.fixture';
import { bootstrapFixture } from '../../../testing/bootstrap.fixture';
import { PARENT_API, PARENT_AUTH_API, PARENT_CHILDREN_API } from './parent-api';

const identity = { ...bootstrapFixture().parent, fullName: 'Léonie Kabila' };
const EVALUATION_ROUTE = new RegExp(`^${PARENT_CHILDREN_API}/[^/]+/evaluations(?:/([^/?]+))?$`);

/** Serveur factice : répond aux routes du portail parent sans quitter le navigateur. */
const mockBackend: HttpInterceptorFn = (req, next) => {
  const ok = (body: unknown = null) => of(new HttpResponse({ status: 200, body }));

  if (req.method === 'GET' && req.url === `${PARENT_API}/bootstrap`) return ok(bootstrapFixture());
  if (req.method === 'GET' && req.url === `${PARENT_AUTH_API}/me`) return ok(identity);
  if (req.method === 'POST' && req.url === `${PARENT_AUTH_API}/magic-link`) return ok();
  if (req.method === 'POST' && req.url === `${PARENT_AUTH_API}/session`) return ok(identity);
  if (req.method === 'DELETE' && req.url === `${PARENT_AUTH_API}/session`) return ok();
  const evaluation = req.method === 'GET' ? EVALUATION_ROUTE.exec(req.url) : null;
  if (evaluation) {
    const body = evaluation[1] ? evaluationDetailFixture(evaluation[1]) : evaluationListFixture();
    if (body) return ok(body);
  }
  if (req.url.startsWith(PARENT_API)) {
    return throwError(() => new HttpErrorResponse({ status: 404, url: req.url }));
  }
  return next(req);
};

export const DEV_BACKEND_INTERCEPTORS: HttpInterceptorFn[] = [mockBackend];
