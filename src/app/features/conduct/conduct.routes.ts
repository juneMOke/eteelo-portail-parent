import { Routes } from '@angular/router';
import { navEntry } from '../../core/navigation/nav';

/** Ma conduite : deux pages, deux registres, des faits datés (spec 06). */
export default [
  { path: '', pathMatch: 'full', redirectTo: 'attendance' },
  {
    path: 'attendance',
    title: navEntry('attendance').title,
    loadComponent: () => import('./attendance/attendance.page'),
  },
  {
    path: 'discipline',
    title: navEntry('discipline').title,
    loadComponent: () => import('./discipline/discipline.page'),
  },
] satisfies Routes;
