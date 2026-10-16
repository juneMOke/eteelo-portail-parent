import { Injector, Signal, afterNextRender, effect, inject, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Une feuille qu'on ouvre et qu'on ferme (`ui-sheet` ou une feuille qui l'enveloppe). */
export interface Openable {
  open(): void;
  close(): void;
}

export interface QueryParamSheet {
  /** Ouvre la fiche de cet élément : son id entre dans l'URL. */
  show(id: string): void;
  /** La fiche s'est fermée : son id sort de l'URL. */
  dismiss(): void;
}

/**
 * Une fiche dont l'ouverture vit dans l'URL (`?fee=<id>`) : un lien peut l'ouvrir depuis une
 * autre page, et le retour vers cette page la rouvre. La fiche s'ouvre quand l'élément nommé par
 * l'URL est chargé et se ferme quand l'URL ne le nomme plus ; ouvrir et fermer remplacent
 * l'entrée d'historique. À appeler dans un contexte d'injection (initialiseur de champ).
 */
export function injectQueryParamSheet(
  key: string,
  options: { readonly selected: Signal<unknown>; readonly sheet: Signal<Openable | undefined> },
): QueryParamSheet {
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  const injector = inject(Injector);

  // Effet de bord seul : la feuille suit l'URL, une fois la page affichée.
  effect(() => {
    const open = options.selected() !== undefined;
    const sheet = options.sheet();
    if (!sheet) return;
    untracked(() => afterNextRender(() => (open ? sheet.open() : sheet.close()), { injector }));
  });

  function navigate(value: string | null): void {
    void router.navigate([], {
      relativeTo: route,
      queryParams: { [key]: value },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  return { show: (id) => navigate(id), dismiss: () => navigate(null) };
}
