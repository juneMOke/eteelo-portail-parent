import { Route } from '@angular/router';
import { NavEntryId, navEntry } from './nav';

/** Route d'une page pas encore livrée : son titre du catalogue et l'écran « Bientôt disponible ». */
export function comingSoonRoute(id: NavEntryId, path = ''): Route {
  return {
    path,
    title: navEntry(id).title,
    loadComponent: () => import('../shell/coming-soon.page'),
  };
}
