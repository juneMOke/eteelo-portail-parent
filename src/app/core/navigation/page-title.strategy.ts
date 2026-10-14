import { Injectable, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';

const APP_NAME = 'Portail parent · ETEELO CONNECT';

function deepest(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  let current = route;
  while (current.firstChild) current = current.firstChild;
  return current;
}

/**
 * Titre de la page courante, lu dans le `title` des routes : affiché par la barre haute et
 * repris dans le titre du document. Indique aussi si la page est l'Accueil (`data.home`),
 * seule page sans bouton retour.
 */
@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  private readonly documentTitle = inject(Title);
  private readonly titleState = signal<string | null>(null);
  private readonly homeState = signal(false);

  readonly title = this.titleState.asReadonly();
  readonly isHome = this.homeState.asReadonly();

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot) ?? null;
    this.titleState.set(title);
    this.homeState.set(deepest(snapshot.root).data['home'] === true);
    this.documentTitle.setTitle(title ? `${title} · ${APP_NAME}` : APP_NAME);
  }
}
