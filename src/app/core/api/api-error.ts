import { HttpErrorResponse } from '@angular/common/http';

/** Corps d'erreur de l'API (`ApiErrorResponse`), réduit à ce que le portail lit. */
export interface ApiErrorBody<Code extends string = string> {
  readonly message?: string;
  readonly detailCode?: Code | null;
}

/** Cause fine d'un 403 du garde par enfant : l'enfant n'est pas (ou plus) visible du parent. */
export const CHILD_NOT_VISIBLE = 'CHILD_NOT_VISIBLE';

/** Cause fine d'une erreur HTTP (`detailCode`) ; null sans corps ou sans cause. */
export function detailCodeOf(error: HttpErrorResponse): string | null {
  return (error.error as ApiErrorBody | null)?.detailCode ?? null;
}
