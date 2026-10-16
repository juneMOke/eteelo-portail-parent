import { Signal, computed, inject } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { GradePart, GradeQuery } from '../../../core/api/grades.contract';
import { TermMemory } from '../../../core/navigation/term-memory';

/**
 * Choix trimestre · période de Mes cours et Mon bulletin. Il vit dans l'URL (`?term=&part=`)
 * pour que le retour d'une fiche et le changement d'enfant le gardent. Il suit aussi le parent
 * d'une page à l'autre pendant la session (spec 05 ③), par `TermMemory`.
 */

/** Une portion choisie : la période scolaire (`term` dans l'URL) et sa partie. */
export interface TermChoice {
  readonly periodId: string;
  readonly part: GradePart;
}

/** Paramètres d'URL d'une sélection ; aucun quand le serveur n'en a retenu aucune. */
export function selectionParams(choice: TermChoice | null): Params {
  return choice ? { term: choice.periodId, part: choice.part } : {};
}

/** Requête au serveur depuis l'URL ; une partie sans sa période ne veut rien dire. */
export function termQuery(term?: string | null, part?: string | null): GradeQuery {
  if (!term) return {};
  return part ? { periodId: term, part } : { periodId: term };
}

export interface TermSelectionControl {
  /** Ce qu'on demande au serveur : l'URL, sinon la sélection de la session, sinon son défaut. */
  readonly query: Signal<GradeQuery>;
  /** Retient le choix et l'inscrit dans l'URL, sans empiler d'historique. */
  select(choice: TermChoice): void;
}

/**
 * Sélection d'une page de Mes cours ou Mon bulletin, depuis ses paramètres d'URL. À appeler
 * dans un contexte d'injection (initialiseur de champ d'une page).
 */
export function injectTermSelection(params: {
  childId: () => string;
  term: () => string | undefined;
  part: () => string | undefined;
}): TermSelectionControl {
  const memory = inject(TermMemory);
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  return {
    query: computed(() => {
      const term = params.term();
      return term ? termQuery(term, params.part()) : (memory.recall(params.childId()) ?? {});
    }),
    select(choice: TermChoice): void {
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
