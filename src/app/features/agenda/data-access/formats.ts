/** Mise en forme des données brutes des devoirs et évaluations ; aucun calcul métier. */

/** « 45 min », « 2 h », « 1 h 30 » ; null si la durée n'est pas connue. */
export function durationLabel(minutes: number | null): string | null {
  if (minutes === null || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, '0')}`;
}

export { fileSizeLabel } from '../../../shared/format/file-size';

const FILE_TYPES: Readonly<Record<string, string>> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'Photo',
  'image/png': 'Photo',
};

export function fileTypeLabel(contentType: string): string {
  return FILE_TYPES[contentType.split(';')[0].trim().toLowerCase()] ?? 'Fichier';
}

/** Nom long coupé au milieu pour garder l'extension (« CE-Chimie-très…-15.pdf »). */
export function middleEllipsis(name: string, max = 40): string {
  if (name.length <= max) return name;
  const tail = Math.ceil((max - 1) / 2);
  const head = max - 1 - tail;
  return `${name.slice(0, head)}…${name.slice(-tail)}`;
}

/** Libellé d'un nombre d'éléments : « Aucune épreuve », « 1 épreuve », « 3 épreuves ». */
export function countLabel(count: number, one: string, many: string, none: string): string {
  if (count === 0) return none;
  return `${count} ${count === 1 ? one : many}`;
}

const DELIVERY_MODES: Readonly<Record<string, string>> = {
  ONLINE: 'En ligne',
  IN_CLASS: 'En classe',
};

/** Mode de remise d'un devoir ; une valeur inconnue reste neutre. */
export function deliveryLabel(mode: string): string {
  return DELIVERY_MODES[mode] ?? 'Non précisé';
}
