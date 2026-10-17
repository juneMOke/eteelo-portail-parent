import { Injectable, ResourceRef, Signal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, catchError, concat, of, tap, throwError } from 'rxjs';

/** Au-delà, la réponse la plus ancienne est oubliée : quelques dizaines de Ko au plus. */
const MAX_ENTRIES = 60;

/** Le temps d'une détection de changement : les rangées créées pendant ce délai sont surlignées. */
const REFRESHED_FOR_MS = 300;

/**
 * La dernière réponse de chaque lecture, en mémoire vive pour la durée de la session : revenir
 * sur une page l'affiche sans squelette, le temps que le serveur réponde. Rien ne quitte la
 * mémoire de l'onglet (ni stockage local, ni service worker : invariant 5) ; recharger l'onglet
 * ou fermer la session la vide.
 */
@Injectable({ providedIn: 'root' })
export class SessionCache {
  private readonly entries = new Map<string, unknown>();

  get<T>(key: string): T | undefined {
    return this.entries.get(key) as T | undefined;
  }

  set(key: string, value: unknown): void {
    this.entries.delete(key);
    this.entries.set(key, value);
    if (this.entries.size > MAX_ENTRIES) this.entries.delete(this.entries.keys().next().value!);
  }

  clear(): void {
    this.entries.clear();
  }
}

/** Une ressource qui affiche d'abord ce qu'elle a déjà lu, puis la réponse du serveur. */
export interface SessionResource<T> extends ResourceRef<T | undefined> {
  /** Une valeur gardée est affichée, la réponse du serveur est attendue. */
  readonly refreshing: Signal<boolean>;
  /** Le serveur n'a pas répondu : la valeur affichée est la dernière connue. */
  readonly stale: Signal<boolean>;
  /** La valeur affichée vient de changer à l'arrivée de la réponse du serveur. */
  readonly refreshed: Signal<boolean>;
}

export interface SessionResourceOptions<P, T> {
  readonly cache: SessionCache;
  /** Le nom de la lecture (« finance.payments ») ; les paramètres complètent la clé. */
  readonly name: string;
  readonly params: () => P | undefined;
  /** Comme pour `rxResource` : `({ params }) => …`. */
  readonly stream: (request: { params: P }) => Observable<T>;
}

/**
 * « Afficher le connu, rafraîchir en fond » : la valeur gardée pour ces paramètres s'affiche
 * aussitôt, la lecture part quand même. Si le serveur répond autre chose, la page se met à jour
 * (`refreshed` le signale) ; s'il échoue, la valeur gardée reste (`stale`) plutôt qu'une page
 * d'erreur. Sans valeur gardée, la ressource se comporte comme `rxResource`. À créer dans un
 * contexte d'injection.
 */
export function sessionResource<P, T>(options: SessionResourceOptions<P, T>): SessionResource<T> {
  const { cache, name } = options;
  const refreshing = signal(false);
  const stale = signal(false);
  const refreshed = signal(false);
  let refreshedTimer: ReturnType<typeof setTimeout> | undefined;
  let currentKey: string | null = null;

  const markRefreshed = () => {
    clearTimeout(refreshedTimer);
    refreshed.set(true);
    refreshedTimer = setTimeout(() => refreshed.set(false), REFRESHED_FOR_MS);
  };

  const resource = rxResource<T, P | undefined>({
    params: options.params,
    stream: ({ params }) => {
      const key = `${name}:${JSON.stringify(params)}`;
      currentKey = key;
      const known = cache.get<T>(key);
      stale.set(false);
      refreshing.set(known !== undefined);
      const fresh = options.stream({ params: params as P }).pipe(
        tap((value) => {
          cache.set(key, value);
          refreshing.set(false);
          if (known !== undefined && JSON.stringify(value) !== JSON.stringify(known)) {
            markRefreshed();
          }
        }),
        catchError((error: unknown) => {
          refreshing.set(false);
          if (known === undefined) return throwError(() => error);
          stale.set(true);
          return of(known);
        }),
      );
      return known === undefined ? fresh : concat(of(known), fresh);
    },
  });

  // Une valeur posée par la page (la fiche après un dépôt) est aussi la dernière connue.
  const set = resource.set.bind(resource);
  return Object.assign(resource, {
    refreshing: refreshing.asReadonly(),
    stale: stale.asReadonly(),
    refreshed: refreshed.asReadonly(),
    set(value: T | undefined): void {
      if (value !== undefined && currentKey) cache.set(currentKey, value);
      set(value);
    },
  });
}
