import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Observable, firstValueFrom } from 'rxjs';
import { ParentApi } from '../../../core/api/parent-api';
import { openInNewTab, shareOrDownload } from '../../../shared/files/document-actions';
import { receiptFileName } from './finance-formats';

/** Un échec de document, rattaché au geste qui l'a provoqué. */
export interface DocumentFailure {
  readonly key: string;
  readonly message: string;
}

interface DocumentsState {
  /** Document en cours de chargement ; null hors chargement. */
  pending: string | null;
  failure: DocumentFailure | null;
}

const initialState: DocumentsState = { pending: null, failure: null };

const TOO_MANY = 'Trop de demandes en peu de temps. Réessayez dans quelques minutes.';
const UNAVAILABLE = 'Le document n’a pas pu être chargé. Vérifiez votre connexion, puis réessayez.';

/** Clé du reçu d'un versement. */
export function receiptKey(paymentId: string): string {
  return `receipt:${paymentId}`;
}

/** Clé du relevé d'une année (`current` pour l'année courante). */
export function statementKey(academicYearId: string | undefined): string {
  return `statement:${academicYearId ?? 'current'}`;
}

/**
 * Les documents de Mes finances : partager un reçu, ouvrir le relevé de l'année. Un store par
 * page. Chaque document chargé reste en mémoire le temps de la visite, jamais sur le téléphone
 * (invariant 5) : rouvrir le relevé ne le régénère pas, et chaque génération prend un numéro
 * de pièce à l'école (POST, plafond d'écriture du portail).
 */
export const FinanceDocumentsStore = signalStore(
  withState(initialState),
  withMethods((store, api = inject(ParentApi)) => {
    const loaded = new Map<string, Blob>();

    /** Le document déjà chargé, sinon chargé maintenant ; l'échec est dans `failure`. */
    async function load(key: string, request: () => Observable<Blob>): Promise<Blob> {
      const cached = loaded.get(key);
      if (cached) return cached;
      patchState(store, { pending: key, failure: null });
      try {
        const blob = await firstValueFrom(request());
        loaded.set(key, blob);
        return blob;
      } catch (error) {
        patchState(store, { failure: { key, message: failureMessage(error) } });
        throw error;
      } finally {
        patchState(store, { pending: null });
      }
    }

    /** Un seul document à la fois : un double toucher en 3G ne relance rien. */
    function busy(): boolean {
      return store.pending() !== null;
    }

    return {
      /** Partage le reçu scellé (WhatsApp, courriel), ou le télécharge à défaut. */
      async shareReceipt(childId: string, paymentId: string, receiptNumber: string): Promise<void> {
        if (busy()) return;
        const key = receiptKey(paymentId);
        try {
          const blob = await load(key, () => api.receipt(childId, paymentId));
          const name = receiptFileName(receiptNumber);
          await shareOrDownload(new File([blob], name, { type: 'application/pdf' }));
        } catch {
          // Échec de chargement déjà dans `failure` ; un partage refusé n'a rien à dire.
        }
      },

      /** Ouvre le relevé de l'année dans un nouvel onglet ; sans année, l'année courante. */
      async openStatement(childId: string, academicYearId?: string): Promise<void> {
        if (busy()) return;
        const key = statementKey(academicYearId);
        try {
          await openInNewTab('Releve.pdf', () =>
            load(key, () => api.statement(childId, academicYearId)),
          );
        } catch {
          // Échec déjà dans `failure`.
        }
      },
    };
  }),
);

function failureMessage(error: unknown): string {
  return error instanceof HttpErrorResponse && error.status === 429 ? TOO_MANY : UNAVAILABLE;
}
