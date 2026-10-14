import { Routes } from '@angular/router';
import { comingSoonRoute } from '../../core/navigation/coming-soon.route';

export default [
  { path: '', pathMatch: 'full', redirectTo: 'fees' },
  comingSoonRoute('fees', 'fees'),
  comingSoonRoute('receipts', 'receipts'),
  comingSoonRoute('payments', 'payments'),
] satisfies Routes;
