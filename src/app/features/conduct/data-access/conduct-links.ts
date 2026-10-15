import { Params } from '@angular/router';
import { DisciplineCase, LinkedCase } from '../../../core/api/conduct.contract';
import { childLink, navEntry } from '../../../core/navigation/nav';
import { monthOf } from '../../../shared/date/civil-date';

/** Liens entre Ma présence et Ma discipline : le parent ne reconstitue pas la chaîne (spec 06 §2). */

export function attendanceLink(childId: string): string[] {
  return childLink(childId, navEntry('attendance').path);
}

export function disciplineLink(childId: string): string[] {
  return childLink(childId, navEntry('discipline').path);
}

/** Ma présence sur un jour, sa fiche ouverte. */
export function dayParams(date: string): Params {
  return { month: monthOf(date), date };
}

/** Ma présence depuis un fait : le jour lié, ou le mois des retards répétés. */
export function linkedAttendanceParams(item: DisciplineCase): Params {
  const link = item.linkedAttendance;
  if (!link) return {};
  return link.kind === 'DAY' ? dayParams(link.date) : { month: monthOf(link.date) };
}

/** Ma discipline sur le trimestre du fait, sa carte en tête. */
export function caseParams(item: LinkedCase): Params {
  return item.periodId ? { term: item.periodId, case: item.id } : { case: item.id };
}
