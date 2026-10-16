/**
 * Le texte d'un élément, espaces fines et insécables (montants, pourcentages) écrites en
 * espaces simples, pour lire les attentes des tests.
 */
export function plainText(el: Element | null | undefined): string {
  return el?.textContent?.replace(/[\u202f\u00a0]/g, ' ').trim() ?? '';
}
