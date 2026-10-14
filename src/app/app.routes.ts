import { Routes } from '@angular/router';
import { HOME_ENTRY } from './core/navigation/nav';
import { childGuard, firstChildGuard } from './core/session/child.guard';
import { sessionGuard } from './core/session/session.guard';

/** Pages d'un enfant, sous /c/:childId. Chaque feature apporte ses routes, chargées à la demande. */
const childRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: HOME_ENTRY.title,
    data: { home: true },
    loadComponent: () => import('./features/home/home.page'),
  },
  { path: 'homework', loadChildren: () => import('./features/agenda/homework/homework.routes') },
  {
    path: 'assessments',
    loadChildren: () => import('./features/agenda/assessments/assessments.routes'),
  },
  { path: 'timetable', loadChildren: () => import('./features/agenda/timetable/timetable.routes') },
  { path: 'grades', loadChildren: () => import('./features/grades/grades.routes') },
  { path: 'conduct', loadChildren: () => import('./features/conduct/conduct.routes') },
  { path: 'finance', loadChildren: () => import('./features/finance/finance.routes') },
  {
    path: 'messages',
    loadChildren: () => import('./features/communication/messages/messages.routes'),
  },
  {
    path: 'notifications',
    loadChildren: () => import('./features/communication/notifications/notifications.routes'),
  },
];

export const routes: Routes = [
  {
    path: 'login',
    title: 'Connexion',
    loadComponent: () => import('./features/auth/login/login.page'),
  },
  {
    path: 'login/:token',
    title: 'Connexion',
    loadComponent: () => import('./features/auth/magic-link/magic-link.page'),
  },
  // Forme courte du lien envoyé sur WhatsApp par le serveur (/m/<jeton>).
  { path: 'm/:token', redirectTo: 'login/:token' },
  {
    path: 'no-children',
    title: 'Aucun élève rattaché',
    canActivate: [sessionGuard],
    loadComponent: () => import('./core/session/no-children.page'),
  },
  {
    path: '',
    canActivate: [sessionGuard],
    children: [
      { path: '', pathMatch: 'full', canActivate: [firstChildGuard], children: [] },
      {
        path: 'c/:childId',
        canActivate: [childGuard],
        loadComponent: () => import('./core/shell/shell.component'),
        children: childRoutes,
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
