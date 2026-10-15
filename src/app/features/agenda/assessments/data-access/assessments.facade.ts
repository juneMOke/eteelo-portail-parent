import { Injectable, ResourceRef, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { EvaluationDetail, EvaluationList } from '../../../../core/api/assignments.contract';
import { ParentApi } from '../../../../core/api/parent-api';

/**
 * Façade de Mes évaluations (lecture seule). La liste rend toute sa fenêtre en un appel, relu à
 * chaque ouverture de la page : changer de jour ne relance aucun appel (seul `?date=` change),
 * mais revenir d'une fiche montre une note publiée entre-temps, et « aujourd'hui » suit le
 * serveur. Rien n'est gardé au-delà de la page, rien n'est stocké sur le téléphone
 * (invariant 5). Statuts, notes et moyennes viennent du serveur.
 */
@Injectable({ providedIn: 'root' })
export class AssessmentsFacade {
  private readonly api = inject(ParentApi);

  list(childId: string): Observable<EvaluationList> {
    return this.api.evaluations(childId);
  }

  detail(childId: string, evaluationId: string): Observable<EvaluationDetail> {
    return this.api.evaluation(childId, evaluationId);
  }

  /** À créer dans un contexte d'injection (initialiseur de champ d'une page). */
  listResource(childId: () => string): ResourceRef<EvaluationList | undefined> {
    return rxResource({ params: () => childId(), stream: ({ params }) => this.list(params) });
  }

  detailResource(
    ids: () => { childId: string; evaluationId: string },
  ): ResourceRef<EvaluationDetail | undefined> {
    return rxResource({
      params: ids,
      stream: ({ params }) => this.detail(params.childId, params.evaluationId),
    });
  }
}
