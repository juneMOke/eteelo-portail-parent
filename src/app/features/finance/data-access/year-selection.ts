import { Signal, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TABLET_SCREEN, mediaQuery } from '../../../shared/layout/media-query';
import { latestValue } from '../../../shared/resource/latest-value';
import { FinanceFacade } from './finance.facade';

/**
 * L'année affichée par Mes reçus et Mes paiements (bandeau C, `?year=`) : une année passée de
 * l'enfant, sinon l'année courante. À appeler dans le contexte d'injection d'une page.
 */
export function injectYearSelection(childId: Signal<string>, year: Signal<string | undefined>) {
  const facade = inject(FinanceFacade);
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  const years = latestValue(facade.academicYearsResource(childId));

  /** L'année passée demandée par l'URL, si l'enfant y a été inscrit ; sinon l'année courante. */
  const pastYear = computed(() => years()?.find((item) => item.id === year() && !item.current));

  return {
    pastYear,
    /**
     * L'année à lire : celle de l'URL dès l'arrivée, sans attendre la liste des années (un seul
     * appel en 3G) ; une fois la liste lue, seulement si c'est une année passée de l'enfant.
     */
    requested: computed(() => (years() ? pastYear()?.id : year())),
    label: computed(() => pastYear()?.label ?? facade.currentYearLabel()),
    /** Les années de l'enfant, la plus récente en tête. */
    choices: computed<readonly { id: string; label: string }[]>(() =>
      (years() ?? []).map((item) => ({ id: item.id, label: item.label })),
    ),
    checked: computed(() => pastYear()?.id ?? years()?.find((item) => item.current)?.id),
    /** Pilules d'année dès la tablette ; menu déroulant au téléphone. */
    wide: mediaQuery(TABLET_SCREEN),
    /** Change d'année par l'URL, sans paramètre pour l'année en cours. */
    pick(id: string | null): void {
      const current = years()?.find((item) => item.id === id)?.current;
      void router.navigate([], {
        relativeTo: route,
        queryParams: { year: current ? null : id },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    },
  };
}
