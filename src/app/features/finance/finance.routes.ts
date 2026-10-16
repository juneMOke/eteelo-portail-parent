import { Routes } from '@angular/router';
import { navEntry } from '../../core/navigation/nav';

/** Mes finances : trois pages, trois objets — ce que je dois, ce que j'ai versé, ce qui le prouve (spec 07). */
export default [
  { path: '', pathMatch: 'full', redirectTo: 'fees' },
  {
    path: 'fees',
    title: navEntry('fees').title,
    loadComponent: () => import('./fees/fees.page'),
  },
  {
    path: 'payments',
    title: navEntry('payments').title,
    loadComponent: () => import('./payments/payments.page'),
  },
  {
    path: 'receipts',
    title: navEntry('receipts').title,
    loadComponent: () => import('./receipts/receipts.page'),
  },
] satisfies Routes;
