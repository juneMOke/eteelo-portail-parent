import { Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

function findChildId(route: ActivatedRouteSnapshot | null): string | null {
  for (let current = route; current; current = current.firstChild) {
    const childId = current.paramMap.get('childId');
    if (childId) return childId;
  }
  return null;
}

/**
 * L'enfant courant lu dans l'URL, pour les composants placés au-dessus de `c/:childId`
 * (le shell) que la liaison des paramètres en input() n'atteint pas.
 */
export function injectChildId(): Signal<string | null> {
  const router = inject(Router);
  const read = () => findChildId(router.routerState.snapshot.root);
  return toSignal(
    router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(read),
    ),
    { initialValue: read() },
  );
}
