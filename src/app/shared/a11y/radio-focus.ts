const STEPS: Readonly<Record<string, 1 | -1>> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
};

/**
 * Parcours d'un groupe radio aux flèches (motif ARIA) : la flèche passe le focus à l'option
 * voisine, en boucle. Les options désactivées sont sautées. Les autres touches sont laissées.
 */
export function moveRadioFocus(
  event: KeyboardEvent,
  index: number,
  options: readonly HTMLElement[],
): void {
  const step = STEPS[event.key];
  if (!step || !options.length) return;
  event.preventDefault();
  for (let offset = 1; offset <= options.length; offset++) {
    const candidate = options[(index + step * offset + options.length * offset) % options.length];
    if (!candidate.hasAttribute('disabled') && candidate.getAttribute('aria-disabled') !== 'true') {
      candidate.focus();
      return;
    }
  }
}
