import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { HomeworkDetail, SubmissionRefusal } from '../../../../core/api/assignments.contract';
import { ParentApi } from '../../../../core/api/parent-api';
import { UploadMessages, trackUpload, uploadFailure } from '../../../../core/api/upload';
import { UploadFailure } from '../../../../shared/ui/file-upload/file-upload.component';

interface SubmissionState {
  /** Part envoyée, de 0 à 1 ; null hors envoi. */
  progress: number | null;
  /** Pourquoi l'envoi n'a pas abouti, et si le même envoi a une chance de passer plus tard. */
  failure: UploadFailure | null;
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

const MESSAGES: UploadMessages = {
  refusals: REFUSALS,
  refused: 'L’école a refusé ce dépôt.',
  tooMany: 'Trop de dépôts en peu de temps. Réessayez dans un moment.',
};

/**
 * Dépôt de la copie d'un devoir (lot P9), seule écriture de Mes devoirs. Un store par fiche
 * (fourni par la page) : la progression et l'échec d'un envoi ne survivent pas à la fiche.
 * Le statut du devoir ne change qu'avec la fiche relue que rend le serveur.
 */
export const HomeworkSubmissionStore = signalStore(
  withState(initialState),
  withMethods((store, api = inject(ParentApi)) => ({
    /** La fiche relue si l'école a reçu la copie ; null sinon (l'échec est dans `failure`). */
    async submit(
      childId: string,
      evaluationId: string,
      files: readonly File[],
    ): Promise<HomeworkDetail | null> {
      if (store.progress() !== null) return null;
      patchState(store, { progress: 0, failure: null });
      try {
        const detail = await trackUpload(
          api.submitHomework(childId, evaluationId, files),
          (progress) => patchState(store, { progress }),
        );
        patchState(store, initialState);
        return detail;
      } catch (error) {
        patchState(store, { progress: null, failure: uploadFailure(error, MESSAGES) });
        return null;
      }
    },

    /** Oublie l'échec quand le parent change de fichier. */
    clearFailure(): void {
      patchState(store, { failure: null });
    },
  })),
);
