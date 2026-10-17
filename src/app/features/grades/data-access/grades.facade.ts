import { Injectable, inject } from '@angular/core';
import {
  GradeCourses,
  GradePeriod,
  GradeQuery,
  GradeWeek,
  ReportCard,
} from '../../../core/api/grades.contract';
import {
  SessionCache,
  SessionResource,
  sessionResource,
} from '../../../shared/resource/session-cache';
import { ParentApi } from '../../../core/api/parent-api';

export interface WeekRequest {
  readonly childId: string;
  /** Un jour de la semaine voulue ; absent, la semaine en cours. */
  readonly weekOf?: string;
}

export interface SelectionRequest {
  readonly childId: string;
  readonly query: GradeQuery;
}

/**
 * Façade de Mes notes (lecture seule, pas de store). Chaque page relit ses données à chaque
 * changement de semaine ou de sélection et à chaque ouverture : une note publiée entre-temps
 * apparaît au retour d'une fiche, après la dernière réponse gardée en mémoire pour la session
 * (`sessionResource`). Moyennes, rangs, états et ordres viennent du serveur ; rien n'est
 * stocké sur le téléphone (invariant 5).
 */
@Injectable({ providedIn: 'root' })
export class GradesFacade {
  private readonly api = inject(ParentApi);
  private readonly cache = inject(SessionCache);

  /** À créer dans un contexte d'injection (initialiseur de champ d'une page). */
  weekResource(request: () => WeekRequest): SessionResource<GradeWeek> {
    return sessionResource({
      cache: this.cache,
      name: 'grades.week',
      params: request,
      stream: ({ params }) => this.api.gradesWeek(params.childId, params.weekOf),
    });
  }

  /** Périodes du choix trimestre · période : relues au changement d'enfant seulement. */
  periodsResource(childId: () => string): SessionResource<GradePeriod[]> {
    return sessionResource({
      cache: this.cache,
      name: 'grades.periods',
      params: childId,
      stream: ({ params }) => this.api.gradePeriods(params),
    });
  }

  coursesResource(request: () => SelectionRequest): SessionResource<GradeCourses> {
    return sessionResource({
      cache: this.cache,
      name: 'grades.courses',
      params: request,
      stream: ({ params }) => this.api.gradeCourses(params.childId, params.query),
    });
  }

  reportCardResource(request: () => SelectionRequest): SessionResource<ReportCard> {
    return sessionResource({
      cache: this.cache,
      name: 'grades.reportCard',
      params: request,
      stream: ({ params }) => this.api.reportCard(params.childId, params.query),
    });
  }
}
