import { Routes } from '@angular/router';
import { navEntry } from '../../../core/navigation/nav';

export default [
  { path: '', title: navEntry('timetable').title, loadComponent: () => import('./timetable.page') },
] satisfies Routes;
