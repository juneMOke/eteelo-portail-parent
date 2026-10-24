import { Routes } from '@angular/router';
import { navEntry } from '../../../core/navigation/nav';

/** Mes messages : les communiqués de l'école, en lecture seule. */
export default [
  {
    path: '',
    title: navEntry('messages').title,
    loadComponent: () => import('./messages.page'),
  },
] satisfies Routes;
