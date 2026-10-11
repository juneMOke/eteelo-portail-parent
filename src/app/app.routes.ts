import { Routes } from '@angular/router';
import { comingSoonRoute } from './core/navigation/coming-soon.route';
import { childGuard, firstChildGuard } from './core/session/child.guard';
import { sessionGuard } from './core/session/session.guard';

/** Pages d'un enfant, sous /c/:childId. Chaque feature apporte ses routes, chargées à la demande. */
const childRoutes: Routes = [
  { ...comingSoonRoute('home'), pathMatch: 'full', data: { home: true } },
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
