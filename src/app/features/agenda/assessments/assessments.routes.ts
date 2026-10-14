import { Routes } from '@angular/router';
import { navEntry } from '../../../core/navigation/nav';

const title = navEntry('assessments').title;

export default [
  { path: '', title, loadComponent: () => import('./assessments.page') },
  {
    path: ':evaluationId',
    title,
    // Le retour de la barre haute ramène à la liste, au jour d'où l'on vient.
    data: { back: 'assessments' },
    loadComponent: () => import('./assessment-detail.page'),
  },
] satisfies Routes;
