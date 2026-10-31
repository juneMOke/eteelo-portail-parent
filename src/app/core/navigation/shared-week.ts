import { Params, UrlTree } from '@angular/router';
import { isCivilDate, mondayOf } from '../../shared/date/civil-date';

/** Les pages qui montrent la même semaine (spec 04 §3) : la quitter ne la perd pas. */
const WEEK_PAGES: readonly string[] = ['homework', 'assessments', 'timetable'];

/**
 * Paramètres du lien d'une page de semaine vers une autre : `?week=` au lundi de la semaine de
 * la page quittée, lue dans son `?week=` ou son `?date=`. Rien vers une autre page, ni quand
 * l'URL ne désigne aucune semaine : la page d'arrivée ouvre alors sur sa semaine par défaut.
 */
export function sharedWeekParams(current: UrlTree, targetPath: string): Params {
  const segments = current.root.children['primary']?.segments ?? [];
  const source = segments[2]?.path;
  if (
    segments[0]?.path !== 'c' ||
    source === targetPath ||
    !WEEK_PAGES.includes(source) ||
    !WEEK_PAGES.includes(targetPath)
  ) {
    return {};
  }
  const { week, date } = current.queryParams;
  const day: string | undefined = week ?? date;
  return isCivilDate(day) ? { week: mondayOf(day) } : {};
}
