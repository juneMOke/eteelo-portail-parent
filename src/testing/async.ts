/** Laisse se résoudre les promesses en cours avant d'inspecter le rendu. */
export function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

/**
 * Fonction asynchrone qui échoue. À préférer à vi.fn().mockRejectedValue(…) : avec Vitest 5,
 * un vi.fn qui rend une promesse rejetée la signale comme non gérée, même quand l'appelant
 * l'attrape.
 */
export function failingWith(error: Error): () => Promise<never> {
  return async () => {
    throw error;
  };
}
