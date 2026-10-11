import { Routes } from '@angular/router';
import { comingSoonRoute } from '../../core/navigation/coming-soon.route';

export default [
  { path: '', pathMatch: 'full', redirectTo: 'week' },
  comingSoonRoute('grades-week', 'week'),
  comingSoonRoute('courses', 'courses'),
  comingSoonRoute('report-card', 'report-card'),
] satisfies Routes;
