import { Routes } from '@angular/router';
import { comingSoonRoute } from '../../core/navigation/coming-soon.route';

export default [
  { path: '', pathMatch: 'full', redirectTo: 'attendance' },
  comingSoonRoute('attendance', 'attendance'),
  comingSoonRoute('discipline', 'discipline'),
] satisfies Routes;
