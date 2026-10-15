import { Injectable, ResourceRef, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { HomeworkDetail, HomeworkList } from '../../../../core/api/assignments.contract';
import { ParentApi } from '../../../../core/api/parent-api';

/**
 * Façade de Mes devoirs en lecture ; le dépôt de copie (lot P9), seule écriture, passe par
 * `HomeworkSubmissionStore`, fourni par la fiche. Comme Mes évaluations : la liste
 * rend toute sa fenêtre en un appel, relu à chaque ouverture de la page ; changer de jour ne
 * relance aucun appel. Rien n'est stocké sur le téléphone (invariant 5). Statuts et notes
 * viennent du serveur.
 */
@Injectable({ providedIn: 'root' })
export class HomeworkFacade {
  private readonly api = inject(ParentApi);

  list(childId: string): Observable<HomeworkList> {
    return this.api.homework(childId);
  }

  detail(childId: string, evaluationId: string): Observable<HomeworkDetail> {
    return this.api.homeworkDetail(childId, evaluationId);
  }

  /** À créer dans un contexte d'injection (initialiseur de champ d'une page). */
  listResource(childId: () => string): ResourceRef<HomeworkList | undefined> {
    return rxResource({ params: () => childId(), stream: ({ params }) => this.list(params) });
  }

  detailResource(
    ids: () => { childId: string; evaluationId: string },
  ): ResourceRef<HomeworkDetail | undefined> {
    return rxResource({
      params: ids,
      stream: ({ params }) => this.detail(params.childId, params.evaluationId),
    });
  }
}
