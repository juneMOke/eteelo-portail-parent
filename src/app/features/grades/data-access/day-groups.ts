import { CivilDate } from '../../../shared/date/civil-date';

export interface DayGroup<T> {
  readonly date: CivilDate;
  readonly items: readonly T[];
}

/**
 * Regroupe par jour une liste déjà ordonnée par le serveur (jour, puis ordre du bulletin), sans
 * la retrier : les jours sans élément n'apparaissent pas.
 */
export function groupByDay<T extends { readonly date: CivilDate }>(
  items: readonly T[],
): DayGroup<T>[] {
  const groups: { date: CivilDate; items: T[] }[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last?.date === item.date) last.items.push(item);
    else groups.push({ date: item.date, items: [item] });
  }
  return groups;
}
