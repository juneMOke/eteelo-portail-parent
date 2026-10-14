/**
 * Tons sémantiques : or (à faire), bleu (information), vert (succès), terre cuite (alerte),
 * neutre. Ils pilotent une couleur, jamais le sens : un mot accompagne toujours le ton.
 */
export type Tone = 'pending' | 'info' | 'success' | 'alert' | 'neutral';
