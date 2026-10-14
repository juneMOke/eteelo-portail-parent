import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { SessionStore } from './session.store';

function firstChildUrl(): UrlTree {
  const [first] = inject(SessionStore).children();
  return inject(Router).createUrlTree(first ? ['/c', first.childId] : ['/no-children']);
}

/** Refuse un childId qui n'est pas un enfant visible du parent : renvoi au premier enfant. */
export const childGuard: CanActivateFn = (route) => {
  const childId = route.paramMap.get('childId');
  const known = childId !== null && inject(SessionStore).childById(childId) !== undefined;
  return known || firstChildUrl();
};

/** Redirige la racine vers l'accueil du premier enfant, ou vers « aucun enfant rattaché ». */
export const firstChildGuard: CanActivateFn = () => firstChildUrl();
