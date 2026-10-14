import { Injectable, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  ActivatedRouteSnapshot,
  Params,
  RouterStateSnapshot,
  TitleStrategy,
} from '@angular/router';
import { HOME_ENTRY, NavEntry, NavEntryId, navEntry } from './nav';

const APP_NAME = 'Portail parent · ETEELO CONNECT';

/** Destination du bouton retour de la barre haute, et ce qu'elle garde de la page quittée. */
export interface BackTarget {
  readonly entry: NavEntry;
  readonly queryParams: Params;
}

const HOME_BACK: BackTarget = { entry: HOME_ENTRY, queryParams: {} };

function deepest(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  let current = route;
  while (current.firstChild) current = current.firstChild;
  return current;
}

/**
 * Pages imbriquées (`data.back`, ex. une fiche) : le retour mène à la page de la liste et lui
 * rend le jour affiché (`?date=`), pour retrouver « même jour, même position ».
 */
function backTarget(route: ActivatedRouteSnapshot): BackTarget {
  const back = route.data['back'] as NavEntryId | undefined;
  if (!back) return HOME_BACK;
  const date = route.queryParamMap.get('date');
  return { entry: navEntry(back), queryParams: date ? { date } : {} };
}

/**
 * Titre de la page courante, lu dans le `title` des routes : affiché par la barre haute et
 * repris dans le titre du document. Indique aussi si la page est l'Accueil (`data.home`),
 * seule page sans bouton retour, et où mène ce bouton.
 */
@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  private readonly documentTitle = inject(Title);
  private readonly titleState = signal<string | null>(null);
  private readonly homeState = signal(false);
  private readonly backState = signal<BackTarget>(HOME_BACK);

  readonly title = this.titleState.asReadonly();
  readonly isHome = this.homeState.asReadonly();
  readonly back = this.backState.asReadonly();

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot) ?? null;
    const page = deepest(snapshot.root);
    this.titleState.set(title);
    this.homeState.set(page.data['home'] === true);
    this.backState.set(backTarget(page));
    this.documentTitle.setTitle(title ? `${title} · ${APP_NAME}` : APP_NAME);
  }
}
