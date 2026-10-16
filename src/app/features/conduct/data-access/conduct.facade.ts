import { Injectable, ResourceRef, Signal, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  AttendanceRange,
  ChildAttendance,
  ChildDiscipline,
} from '../../../core/api/conduct.contract';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';

export interface AttendanceWeekRequest extends AttendanceRange {
  readonly childId: string;
}

export interface DisciplineRequest {
  readonly childId: string;
  /** Absent : le trimestre en cours. */
  readonly periodId?: string;
}

/**
 * Façade de Ma conduite en lecture. Ma présence lit toute l'année en un appel (environ 200
 * jours) : changer de mois ne relance rien, et l'en-tête, le calendrier et la liste lisent la
 * même réponse. Seuls les indicateurs de la semaine ont leur appel, borné à la semaine : le
 * serveur en fait le résumé (invariant 2). Ma discipline lit un trimestre. Taux, comptes, délais et gravités viennent du
 * serveur ; rien n'est gardé sur le téléphone (invariant 5). La justification, seule écriture,
 * passe par `AbsenceJustificationStore`.
 */
@Injectable({ providedIn: 'root' })
export class ConductFacade {
  private readonly api = inject(ParentApi);
  private readonly session = inject(SessionStore);

  /** Téléphone du secrétariat de l'école ; null s'il n'est pas saisi. */
  readonly schoolPhone: Signal<string | null> = computed(
    () => this.session.school()?.contactPhone ?? null,
  );

  /** À créer dans un contexte d'injection (initialiseur de champ d'une page). */
  attendanceResource(childId: () => string): ResourceRef<ChildAttendance | undefined> {
    return rxResource({ params: childId, stream: ({ params }) => this.api.attendance(params) });
  }

  /** Résumé de la semaine affichée ; au repos tant que la page n'a pas de semaine. */
  attendanceWeekResource(
    request: () => AttendanceWeekRequest | undefined,
  ): ResourceRef<ChildAttendance | undefined> {
    return rxResource({
      params: request,
      stream: ({ params: { childId, from, to } }) => this.api.attendance(childId, { from, to }),
    });
  }

  disciplineResource(request: () => DisciplineRequest): ResourceRef<ChildDiscipline | undefined> {
    return rxResource({
      params: request,
      stream: ({ params }) => this.api.discipline(params.childId, params.periodId),
    });
  }
}
