import { HttpErrorResponse } from '@angular/common/http';

/**
 * Fiche invisible pour cet enfant, ou du mauvais genre (un devoir demandé sous Mes évaluations,
 * une épreuve sous Mes devoirs). Une ressource enveloppe l'erreur HTTP (qui n'est pas une
 * `Error`) : on regarde aussi sa cause.
 */
export function isNotFound(error: unknown): boolean {
  const cause = error instanceof Error && error.cause !== undefined ? error.cause : error;
  return cause instanceof HttpErrorResponse && cause.status === 404;
}
