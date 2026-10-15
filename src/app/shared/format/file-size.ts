import { formatNumber } from '@angular/common';

/** Poids d'un fichier : le parent paie ses données (« 1,2 Mo », « 850 Ko »). */
export function fileSizeLabel(bytes: number, locale: string): string {
  if (bytes >= 1_000_000) return `${formatNumber(bytes / 1_000_000, locale, '1.0-1')} Mo`;
  return `${formatNumber(Math.max(1, Math.round(bytes / 1_000)), locale, '1.0-0')} Ko`;
}
