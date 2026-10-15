import { Routes } from '@angular/router';
import { navEntry } from '../../../core/navigation/nav';

const title = navEntry('homework').title;

export default [
  { path: '', title, loadComponent: () => import('./homework.page') },
  {
    path: ':evaluationId',
    title,
    // Le retour de la barre haute ramène à la liste, au jour d'où l'on vient.
    data: { back: 'homework' },
    loadComponent: () => import('./homework-detail.page'),
  },
] satisfies Routes;
