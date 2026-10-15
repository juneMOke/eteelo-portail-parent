import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UploadFailure } from '../../shared/ui/file-upload/file-upload.component';

/** Corps d'erreur de l'API (`ApiError`), réduit à ce que le portail lit. */
export interface ApiErrorBody<Code extends string = string> {
  readonly message?: string;
  readonly detailCode?: Code | null;
}

/** L'envoi n'a pas abouti : le même envoi a une chance de passer plus tard. */
export const INTERRUPTED: UploadFailure = { message: 'L’envoi n’a pas abouti.', retryable: true };

/** Réponse attendue manquante : on ne sait pas si l'envoi est arrivé. */
export class UploadInterrupted extends Error {}

/**
 * Suit un envoi émis en événements (`observe: 'events'`, `reportProgress`) : la part envoyée,
 * de 0 à 1, à chaque progression connue ; la promesse rend le corps de la réponse. Une réponse
 * sans corps rejette avec `UploadInterrupted`, une erreur HTTP avec elle-même.
 */
export function trackUpload<T>(
  events: Observable<HttpEvent<T>>,
  onProgress: (progress: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let done = false;
    events.subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          onProgress(event.loaded / event.total);
        } else if (event.type === HttpEventType.Response && event.body) {
          done = true;
          resolve(event.body);
        }
      },
      error: (error: unknown) => reject(error),
      complete: () => {
        if (!done) reject(new UploadInterrupted());
      },
    });
  });
}

/** Les mots d'un envoi refusé, propres à chaque dépôt. */
export interface UploadMessages {
  /** Message de chaque cause fine de refus (`detailCode` d'un 422). */
  readonly refusals: Readonly<Record<string, string>>;
  /** Refus d'une cause inconnue. */
  readonly refused: string;
  /** Trop d'envois en peu de temps (429). */
  readonly tooMany: string;
}

/**
 * Ce qu'on dit au parent d'un envoi qui n'a pas abouti. Un 422 est terminal : la cause fine
 * choisit son message, une cause inconnue reste neutre. Trop d'envois (429) ou une coupure
 * laissent réessayer le même envoi.
 */
export function uploadFailure(error: unknown, messages: UploadMessages): UploadFailure {
  if (!(error instanceof HttpErrorResponse)) return INTERRUPTED;
  if (error.status === 422) {
    const code = (error.error as ApiErrorBody | null)?.detailCode;
    return { message: (code && messages.refusals[code]) || messages.refused, retryable: false };
  }
  if (error.status === 429) return { message: messages.tooMany, retryable: true };
  return INTERRUPTED;
}
