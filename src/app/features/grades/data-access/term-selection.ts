import { Injectable, Signal, computed, inject } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TermQuery, TermSelection } from '../../../core/api/grades.contract';

/**
 * Choix trimestre · période de Mes cours et Mon bulletin. Il vit dans l'URL (`?term=&period=`)
 * pour que le retour d'une fiche et le changement d'enfant le gardent. Il suit aussi le parent
 * d'une page à l'autre pendant la session (spec 05 ③) : la mémoire ci-dessous, en mémoire vive
 * seulement, rien sur le téléphone.
 */

type Choice = Pick<TermSelection, 'termId' | 'periodId'>;

/** Paramètres d'URL d'une sélection ; une période nulle vaut « tout le trimestre ». */
export function selectionParams(selection: Choice): Params {
  return { term: selection.termId, period: selection.periodId };
}

/** Requête au serveur depuis l'URL ; une période sans trimestre ne veut rien dire. */
export function termQuery(term?: string | null, period?: string | null): TermQuery {
  if (!term) return {};
  return period ? { termId: term, periodId: period } : { termId: term };
}

@Injectable({ providedIn: 'root' })
export class TermSelectionMemory {
  private readonly selections = new Map<string, TermQuery>();

  remember(childId: string, selection: Choice): void {
    this.selections.set(childId, termQuery(selection.termId, selection.periodId));
  }

  /** La dernière sélection choisie pour cet enfant pendant la session. */
  recall(childId: string): TermQuery | undefined {
    return this.selections.get(childId);
  }
}

export interface TermSelectionControl {
  /** Ce qu'on demande au serveur : l'URL, sinon la sélection de la session, sinon son défaut. */
  readonly query: Signal<TermQuery>;
  /** Retient le choix et l'inscrit dans l'URL, sans empiler d'historique. */
  select(choice: Choice): void;
}

/**
 * Sélection d'une page de Mes cours ou Mon bulletin, depuis ses paramètres d'URL. À appeler
 * dans un contexte d'injection (initialiseur de champ d'une page).
 */
export function injectTermSelection(params: {
  childId: () => string;
  term: () => string | undefined;
  period: () => string | undefined;
}): TermSelectionControl {
  const memory = inject(TermSelectionMemory);
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  return {
    query: computed(() => {
      const term = params.term();
      return term ? termQuery(term, params.period()) : (memory.recall(params.childId()) ?? {});
    }),
    select(choice: Choice): void {
      memory.remember(params.childId(), choice);
      void router.navigate([], {
        relativeTo: route,
        queryParams: { ...selectionParams(choice), course: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    },
  };
}
