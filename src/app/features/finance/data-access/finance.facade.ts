import { Injectable, Signal, computed, inject } from '@angular/core';
import { AcademicYear, ChildFees, Payment } from '../../../core/api/finance.contract';
import {
  SessionCache,
  SessionResource,
  sessionResource,
} from '../../../shared/resource/session-cache';
import { ParentApi, receiptUrl } from '../../../core/api/parent-api';
import { childName } from '../../../core/session/child-format';
import { SessionStore } from '../../../core/session/session.store';

export interface PaymentsRequest {
  readonly childId: string;
  /** Absent : l'année courante. */
  readonly academicYearId?: string;
}

/**
 * Façade de Mes finances en lecture. Chaque page relit ses données à l'ouverture : un
 * versement enregistré entre-temps apparaît au retour. États, restes, totaux et ordres viennent
 * du serveur. La dernière réponse reste en mémoire pour la session (`sessionResource`) et
 * s'affiche au retour le temps que le serveur réponde ; rien n'est stocké sur le téléphone
 * (invariant 5). Les documents (partage d'un
 * reçu, relevé de l'année) passent par `FinanceDocumentsStore`.
 */
@Injectable({ providedIn: 'root' })
export class FinanceFacade {
  private readonly api = inject(ParentApi);
  private readonly cache = inject(SessionCache);
  private readonly session = inject(SessionStore);

  /** Téléphone du secrétariat de l'école ; null s'il n'est pas saisi. */
  readonly schoolPhone: Signal<string | null> = computed(
    () => this.session.school()?.contactPhone ?? null,
  );

  /** « 2026-2027 » : l'année courante, lue dans la session. */
  readonly currentYearLabel: Signal<string> = computed(
    () => this.session.academicYear()?.name ?? '',
  );

  /** « Josué » : le prénom de l'enfant, dans « Comment payer ». */
  childName(childId: string): string | null {
    const child = this.session.childById(childId);
    return child ? childName(child) : null;
  }

  /** À créer dans un contexte d'injection (initialiseur de champ d'une page). */
  feesResource(childId: () => string): SessionResource<ChildFees> {
    return sessionResource({
      cache: this.cache,
      name: 'finance.fees',
      params: childId,
      stream: ({ params }) => this.api.fees(params),
    });
  }

  paymentsResource(request: () => PaymentsRequest): SessionResource<Payment[]> {
    return sessionResource({
      cache: this.cache,
      name: 'finance.payments',
      params: request,
      stream: ({ params }) => this.api.payments(params.childId, params.academicYearId),
    });
  }

  /** Années où l'enfant a été inscrit : relues au changement d'enfant seulement. */
  academicYearsResource(childId: () => string): SessionResource<AcademicYear[]> {
    return sessionResource({
      cache: this.cache,
      name: 'finance.academicYears',
      params: childId,
      stream: ({ params }) => this.api.academicYears(params),
    });
  }

  /** Le reçu scellé d'un versement, ouvrable dans un nouvel onglet. */
  receiptHref(childId: string, paymentId: string): string {
    return receiptUrl(childId, paymentId);
  }
}
