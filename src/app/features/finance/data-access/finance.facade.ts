import { Injectable, ResourceRef, Signal, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AcademicYear, ChildFees, Payment } from '../../../core/api/finance.contract';
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
 * du serveur ; rien n'est gardé sur le téléphone (invariant 5). Les documents (partage d'un
 * reçu, relevé de l'année) passent par `FinanceDocumentsStore`.
 */
@Injectable({ providedIn: 'root' })
export class FinanceFacade {
  private readonly api = inject(ParentApi);
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
  feesResource(childId: () => string): ResourceRef<ChildFees | undefined> {
    return rxResource({ params: childId, stream: ({ params }) => this.api.fees(params) });
  }

  paymentsResource(request: () => PaymentsRequest): ResourceRef<Payment[] | undefined> {
    return rxResource({
      params: request,
      stream: ({ params }) => this.api.payments(params.childId, params.academicYearId),
    });
  }

  /** Années où l'enfant a été inscrit : relues au changement d'enfant seulement. */
  academicYearsResource(childId: () => string): ResourceRef<AcademicYear[] | undefined> {
    return rxResource({ params: childId, stream: ({ params }) => this.api.academicYears(params) });
  }

  /** Le reçu scellé d'un versement, ouvrable dans un nouvel onglet. */
  receiptHref(childId: string, paymentId: string): string {
    return receiptUrl(childId, paymentId);
  }
}
