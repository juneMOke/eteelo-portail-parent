/** Libellé d'un nombre d'éléments : « Aucune épreuve », « 1 épreuve », « 3 épreuves ». */
export function countLabel(count: number, one: string, many: string, none: string): string {
  if (count === 0) return none;
  return `${count} ${count === 1 ? one : many}`;
}
