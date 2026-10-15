import { Injectable, ResourceRef, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  GradeCourses,
  GradePeriod,
  GradeQuery,
  GradeWeek,
  ReportCard,
} from '../../../core/api/grades.contract';
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
 * apparaît au retour d'une fiche. Moyennes, rangs, états et ordres viennent du serveur ; rien
 * n'est gardé sur le téléphone (invariant 5).
 */
@Injectable({ providedIn: 'root' })
export class GradesFacade {
  private readonly api = inject(ParentApi);

  /** À créer dans un contexte d'injection (initialiseur de champ d'une page). */
  weekResource(request: () => WeekRequest): ResourceRef<GradeWeek | undefined> {
    return rxResource({
      params: request,
      stream: ({ params }) => this.api.gradesWeek(params.childId, params.weekOf),
    });
  }

  /** Périodes du choix trimestre · période : relues au changement d'enfant seulement. */
  periodsResource(childId: () => string): ResourceRef<GradePeriod[] | undefined> {
    return rxResource({
      params: childId,
      stream: ({ params }) => this.api.gradePeriods(params),
    });
  }

  coursesResource(request: () => SelectionRequest): ResourceRef<GradeCourses | undefined> {
    return rxResource({
      params: request,
      stream: ({ params }) => this.api.gradeCourses(params.childId, params.query),
    });
  }

  reportCardResource(request: () => SelectionRequest): ResourceRef<ReportCard | undefined> {
    return rxResource({
      params: request,
      stream: ({ params }) => this.api.reportCard(params.childId, params.query),
    });
  }
}
