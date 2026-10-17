import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
} from '@angular/router';
import { filter, map } from 'rxjs';

/**
 * La navigation en cours : l'URL demandée, du clic jusqu'à l'affichage de la page (code
 * téléchargé, gardes passées). Le menu s'en sert pour marquer tout de suite l'entrée touchée,
 * la barre de progression pour dire que le geste est pris en compte.
 */
@Injectable({ providedIn: 'root' })
export class NavigationProgress {
  /** L'URL demandée, telle que cliquée ; null hors navigation. */
  readonly pendingUrl = toSignal(
    inject(Router).events.pipe(
      filter(
        (event) =>
          event instanceof NavigationStart ||
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError ||
          event instanceof NavigationSkipped,
      ),
      map((event) => (event instanceof NavigationStart ? event.url : null)),
    ),
    { initialValue: null },
  );
  /** Le chemin demandé, sans paramètres de requête. */
  readonly pendingPath = computed(() => this.pendingUrl()?.split(/[?#]/)[0] ?? null);
}
