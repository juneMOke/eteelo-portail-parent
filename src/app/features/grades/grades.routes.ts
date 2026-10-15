import { Routes } from '@angular/router';
import { navEntry } from '../../core/navigation/nav';

/** Mes notes : trois pages lues sur le même jeu d'évaluations, coupé de trois façons. */
export default [
  { path: '', pathMatch: 'full', redirectTo: 'week' },
  {
    path: 'week',
    title: navEntry('grades-week').title,
    loadComponent: () => import('./week/grades-week.page'),
  },
  {
    path: 'courses',
    title: navEntry('courses').title,
    loadComponent: () => import('./courses/courses.page'),
  },
  {
    path: 'report-card',
    title: navEntry('report-card').title,
    loadComponent: () => import('./report-card/report-card.page'),
  },
] satisfies Routes;
