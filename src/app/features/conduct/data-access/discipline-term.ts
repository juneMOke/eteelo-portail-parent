import { Signal, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TermMemory } from '../../../core/navigation/term-memory';

export interface DisciplineTermControl {
  /** Trimestre demandé : l'URL, sinon le choix de la session ; absent, celui en cours. */
  readonly periodId: Signal<string | undefined>;
  /** Retient le choix et l'inscrit dans l'URL, sans empiler d'historique. */
  select(periodId: string): void;
}

/**
 * ⑥ Le trimestre de Ma discipline vit dans l'URL (`?term=`), comme dans Mes notes, et suit le
 * parent d'une page à l'autre pendant la session (`TermMemory`). À appeler dans un contexte
 * d'injection (initialiseur de champ d'une page).
 */
export function injectDisciplineTerm(params: {
  childId: () => string;
  term: () => string | undefined;
}): DisciplineTermControl {
  const memory = inject(TermMemory);
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  return {
    periodId: computed(() => params.term() ?? memory.recall(params.childId())?.periodId),
    select(periodId: string): void {
      memory.rememberPeriod(params.childId(), periodId);
      void router.navigate([], {
        relativeTo: route,
        queryParams: { term: periodId, case: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    },
  };
}
