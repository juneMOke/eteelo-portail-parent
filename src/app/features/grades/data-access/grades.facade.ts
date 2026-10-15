import { Injectable, ResourceRef, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { GradeCourses, GradeWeek, ReportCard, TermQuery } from '../../../core/api/grades.contract';
import { ParentApi, reportCardDocumentUrl } from '../../../core/api/parent-api';

export interface WeekRequest {
  readonly childId: string;
  /** Un jour de la semaine voulue ; absent, la semaine en cours. */
  readonly date?: string;
}

export interface TermRequest {
  readonly childId: string;
  readonly query: TermQuery;
}

/**
 * Façade de Mes notes (lecture seule, pas de store). Chaque page fait un seul appel, relu à
 * chaque changement de semaine ou de sélection et à chaque ouverture : une note publiée
 * entre-temps apparaît au retour d'une fiche. Moyennes, rangs, états et ordres viennent du
 * serveur ; rien n'est gardé sur le téléphone (invariant 5).
 */
@Injectable({ providedIn: 'root' })
export class GradesFacade {
  private readonly api = inject(ParentApi);

  /** À créer dans un contexte d'injection (initialiseur de champ d'une page). */
  weekResource(request: () => WeekRequest): ResourceRef<GradeWeek | undefined> {
    return rxResource({
      params: request,
      stream: ({ params }) => this.api.gradesWeek(params.childId, params.date),
    });
  }

  coursesResource(request: () => TermRequest): ResourceRef<GradeCourses | undefined> {
    return rxResource({
      params: request,
      stream: ({ params }) => this.api.gradeCourses(params.childId, params.query),
    });
  }

  reportCardResource(request: () => TermRequest): ResourceRef<ReportCard | undefined> {
    return rxResource({
      params: request,
      stream: ({ params }) => this.api.reportCard(params.childId, params.query),
    });
  }

  /** Lien de téléchargement du PDF scellé. */
  documentUrl(childId: string, reportCardId: string): string {
    return reportCardDocumentUrl(childId, reportCardId);
  }
}
