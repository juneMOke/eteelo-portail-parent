import { Params } from '@angular/router';
import { childLink, navEntry } from '../../../core/navigation/nav';

/**
 * Liens entre Mes frais et Mes paiements : un versement mène au frais qu'il couvre, un frais à
 * ses versements, chaque fois la fiche ouverte (spec 07 §9). Le retour rouvre la fiche quittée.
 */

export function feesLink(childId: string): string[] {
  return childLink(childId, navEntry('fees').path);
}

export function paymentsLink(childId: string): string[] {
  return childLink(childId, navEntry('payments').path);
}

/** Mes frais, la fiche du frais ouverte. */
export function feeParams(feeId: string): Params {
  return { fee: feeId };
}

/** Mes paiements, la fiche du versement ouverte. */
export function paymentParams(paymentId: string): Params {
  return { payment: paymentId };
}
