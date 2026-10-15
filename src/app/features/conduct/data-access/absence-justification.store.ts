import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { JustificationReason, JustificationRefusal } from '../../../core/api/conduct.contract';
import { ParentApi } from '../../../core/api/parent-api';
import { UploadMessages, trackUpload, uploadFailure } from '../../../core/api/upload';
import { downscaleImage } from '../../../shared/files/downscale-image';
import { UploadFailure } from '../../../shared/ui/file-upload/file-upload.component';

/** Ce que le parent a rempli dans la feuille. */
export interface JustificationDraft {
  readonly reason: JustificationReason;
  readonly note: string;
  readonly file: File | null;
}

interface JustificationState {
  /** Jour en cours d'envoi ; null hors envoi. */
  sending: string | null;
  /** Part envoyée, de 0 à 1 ; null hors envoi. */
  progress: number | null;
  failure: UploadFailure | null;
  /**
   * Uuid de la demande de chaque jour, gardé jusqu'à ce que l'école l'ait reçue : renvoyer
   * après une coupure ne crée pas de doublon (le serveur reconnaît l'id).
   */
  requestIds: Readonly<Record<string, string>>;
}

const initialState: JustificationState = {
  sending: null,
  progress: null,
  failure: null,
  requestIds: {},
};

/** Refus du serveur (422) : terminaux ; la page relit la présence pour montrer l'état réel. */
const REFUSALS: Readonly<Record<JustificationRefusal, string>> = {
  NOT_AN_ABSENCE: 'Ce jour n’est pas une absence : il n’y a rien à justifier.',
  ALREADY_JUSTIFIED: 'Cette absence est déjà justifiée.',
  JUSTIFICATION_PENDING: 'Une justification est déjà en attente de l’école.',
  JUSTIFICATION_CLOSED: 'Le délai de justification est passé.',
};

const MESSAGES: UploadMessages = {
  refusals: REFUSALS,
  refused: 'L’école n’a pas accepté cet envoi.',
  tooMany: 'Trop d’envois en peu de temps. Réessayez dans un moment.',
};

/**
 * Justification d'une absence (lot C2), seule écriture de Ma présence. Un store par page :
 * l'envoi, son échec et l'id de chaque demande vivent tant que la page est ouverte, en mémoire
 * seulement (invariant 5) ; rien n'est gardé pour un envoi différé. L'état du jour ne change
 * qu'avec la présence relue au serveur.
 */
export const AbsenceJustificationStore = signalStore(
  withState(initialState),
  withMethods((store, api = inject(ParentApi)) => ({
    /** Vrai si l'école a reçu la justification ; faux sinon (l'échec est dans `failure`). */
    async submit(childId: string, date: string, draft: JustificationDraft): Promise<boolean> {
      if (store.sending() !== null) return false;
      const id = store.requestIds()[date] ?? crypto.randomUUID();
      patchState(store, {
        sending: date,
        progress: 0,
        failure: null,
        requestIds: { ...store.requestIds(), [date]: id },
      });
      try {
        const file = draft.file && (await downscaleImage(draft.file));
        await trackUpload(
          api.justifyAbsence(childId, date, { id, ...draft, note: draft.note.trim(), file }),
          (progress) => patchState(store, { progress }),
        );
        const requestIds = { ...store.requestIds() };
        delete requestIds[date];
        patchState(store, { sending: null, progress: null, requestIds });
        return true;
      } catch (error) {
        patchState(store, {
          sending: null,
          progress: null,
          failure: uploadFailure(error, MESSAGES),
        });
        return false;
      }
    },

    /** Oublie l'échec quand le parent rouvre la feuille ou change de jour. */
    clearFailure(): void {
      patchState(store, { failure: null });
    },
  })),
);
