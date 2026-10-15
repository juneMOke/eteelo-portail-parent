import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import {
  ApiErrorBody,
  HomeworkDetail,
  SubmissionRefusal,
} from '../../../../core/api/assignments.contract';
import { ParentApi } from '../../../../core/api/parent-api';

/** Pourquoi l'envoi n'a pas abouti, et si le même envoi a une chance de passer plus tard. */
export interface SubmissionFailure {
  readonly message: string;
  readonly retryable: boolean;
}

interface SubmissionState {
  /** Part envoyée, de 0 à 1 ; null hors envoi. */
  progress: number | null;
  failure: SubmissionFailure | null;
}

const initialState: SubmissionState = { progress: null, failure: null };

/** Refus du serveur (422) : terminaux, le même envoi échouera toujours. */
const REFUSALS: Readonly<Record<SubmissionRefusal, string>> = {
  SUBMISSION_NOT_ONLINE: 'Ce devoir se remet en classe, pas en ligne.',
  SUBMISSION_CLOSED: 'Le dépôt est fermé pour ce devoir.',
  UNSUPPORTED_DOCUMENT_TYPE: 'Format accepté : PDF ou photo.',
  EMPTY_DOCUMENT: 'Un des fichiers choisis est vide.',
  DOCUMENT_TOO_LARGE: 'Ce dépôt dépasse 10 Mo.',
  SUBMISSION_TOO_MANY_FILES: 'Trop de photos pour un seul dépôt : envoyez plutôt un PDF.',
};

const INTERRUPTED: SubmissionFailure = { message: 'L’envoi n’a pas abouti.', retryable: true };

function failureOf(error: unknown): SubmissionFailure {
  if (!(error instanceof HttpErrorResponse)) return INTERRUPTED;
  if (error.status === 422) {
    const body = error.error as ApiErrorBody | null;
    const message = body?.detailCode ? REFUSALS[body.detailCode] : undefined;
    return { message: message ?? 'L’école a refusé ce dépôt.', retryable: false };
  }
  if (error.status === 429) {
    return {
      message: 'Trop de dépôts en peu de temps. Réessayez dans un moment.',
      retryable: true,
    };
  }
  return INTERRUPTED;
}

/**
 * Dépôt de la copie d'un devoir (lot P9), seule écriture de Mes devoirs. Un store par fiche
 * (fourni par la page) : la progression et l'échec d'un envoi ne survivent pas à la fiche.
 * Le statut du devoir ne change qu'avec la fiche relue que rend le serveur.
 */
export const HomeworkSubmissionStore = signalStore(
  withState(initialState),
  withMethods((store, api = inject(ParentApi)) => ({
    /** La fiche relue si l'école a reçu la copie ; null sinon (l'échec est dans `failure`). */
    submit(
      childId: string,
      evaluationId: string,
      files: readonly File[],
    ): Promise<HomeworkDetail | null> {
      if (store.progress() !== null) return Promise.resolve(null);
      patchState(store, { progress: 0, failure: null });
      return new Promise((resolve) => {
        api.submitHomework(childId, evaluationId, files).subscribe({
          next: (event) => {
            if (event.type === HttpEventType.UploadProgress && event.total) {
              patchState(store, { progress: event.loaded / event.total });
            } else if (event.type === HttpEventType.Response && event.body) {
              patchState(store, initialState);
              resolve(event.body);
            }
          },
          error: (error: unknown) => {
            patchState(store, { progress: null, failure: failureOf(error) });
            resolve(null);
          },
          complete: () => {
            // Réponse sans corps : on ne sait pas si la copie est arrivée.
            if (store.progress() !== null) {
              patchState(store, { progress: null, failure: INTERRUPTED });
              resolve(null);
            }
          },
        });
      });
    },

    /** Oublie l'échec quand le parent change de fichier. */
    clearFailure(): void {
      patchState(store, { failure: null });
    },
  })),
);
