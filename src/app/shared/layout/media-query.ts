import { DestroyRef, Signal, inject, signal } from '@angular/core';

/** Point de rupture principal (grille Material) : au-dessus, menu latéral et vues larges. */
export const WIDE_SCREEN = '(min-width: 905px)';

/**
 * Vrai tant que la media query correspond ; suit le redimensionnement et la rotation. À créer
 * dans un contexte d'injection. Sans `matchMedia` (rendu de test), répond faux : la mise en
 * page du téléphone, la plus sobre.
 */
export function mediaQuery(query: string): Signal<boolean> {
  const list = typeof matchMedia === 'function' ? matchMedia(query) : null;
  const matches = signal(list?.matches ?? false);
  if (list) {
    const onChange = (event: MediaQueryListEvent) => matches.set(event.matches);
    list.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => list.removeEventListener('change', onChange));
  }
  return matches.asReadonly();
}
