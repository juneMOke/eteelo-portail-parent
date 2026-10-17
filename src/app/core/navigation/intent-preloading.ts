import { DOCUMENT, DestroyRef, Injectable, inject } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, ReplaySubject, filter, mergeMap, take } from 'rxjs';

/** Gestes qui annoncent un clic : survol, focus clavier, doigt posé. */
const INTENT_EVENTS = ['pointerover', 'focusin', 'touchstart'] as const;

/** Les segments d'un chemin : « /c/42/timetable?x=1 » donne ['c', '42', 'timetable']. */
function segments(path: string): string[] {
  return path.split(/[?#]/)[0].split('/').filter(Boolean);
}

/**
 * Le chemin d'une route se retrouve, d'un seul tenant, dans l'URL visée (`:param` vaut tout
 * segment). Une route ne connaît pas ses parents : « timetable » se cherche dans
 * « /c/42/timetable ». Une route sans segment (la page d'une feature, `''`) suit l'intention
 * qui a fait charger sa feature.
 */
export function routeMatches(route: Route, url: string): boolean {
  const pattern = segments(route.path ?? '');
  const target = segments(url);
  if (!pattern.length) return true;
  return target.some((_, start) =>
    pattern.every((part, index) => {
      const segment = target[start + index];
      return segment !== undefined && (part.startsWith(':') || part === segment);
    }),
  );
}

/**
 * Préchargement à l'intention : le code d'une page se télécharge dès que le parent survole son
 * lien, y place le focus ou le touche, avant le clic. Rien n'est chargé pour une page qu'on ne
 * vise pas : en 3G, chaque Ko compte. Les données, elles, restent lues à l'ouverture de la page.
 */
@Injectable({ providedIn: 'root' })
export class IntentPreloading implements PreloadingStrategy {
  private readonly document = inject(DOCUMENT);
  /** Chaque URL visée, une fois ; rejouées pour les routes d'une feature tout juste chargée. */
  private readonly intents = new ReplaySubject<string>();
  private readonly seen = new Set<string>();

  constructor() {
    const listener = (event: Event) => this.notice(event);
    for (const type of INTENT_EVENTS) {
      this.document.addEventListener(type, listener, { capture: true, passive: true });
    }
    inject(DestroyRef).onDestroy(() => {
      for (const type of INTENT_EVENTS) {
        this.document.removeEventListener(type, listener, { capture: true });
      }
    });
  }

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    return this.intents.pipe(
      filter((url) => routeMatches(route, url)),
      take(1),
      mergeMap(() => load()),
    );
  }

  /** Une URL visée : ses pages se préchargent. */
  intend(url: string): void {
    if (this.seen.has(url)) return;
    this.seen.add(url);
    this.intents.next(url);
  }

  private notice(event: Event): void {
    const link = (event.target as Element | null)?.closest?.('a[href]');
    if (!(link instanceof HTMLAnchorElement)) return;
    if (link.origin !== this.document.location.origin || link.pathname.startsWith('/api/')) return;
    this.intend(link.pathname);
  }
}
