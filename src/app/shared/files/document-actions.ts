/**
 * Gestes sur un document chargé (un PDF) : le partager par la feuille de partage du téléphone,
 * le télécharger à défaut, l'ouvrir dans un nouvel onglet.
 */

/** Ce qu'il est advenu d'un partage : partagé, téléchargé faute de partage, ou abandonné. */
export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled';

/** Délai avant de libérer l'adresse locale d'un document : le temps que l'onglet le lise. */
const RELEASE_AFTER_MS = 60_000;

/**
 * Partage un fichier (WhatsApp, courriel…) quand le téléphone sait partager un fichier ; sinon
 * le télécharge. Fermer la feuille de partage n'est pas une erreur.
 */
export async function shareOrDownload(file: File): Promise<ShareOutcome> {
  if (!navigator.canShare?.({ files: [file] })) {
    download(file);
    return 'downloaded';
  }
  try {
    await navigator.share({ files: [file], title: file.name });
    return 'shared';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    throw error;
  }
}

/** Télécharge un fichier sous son nom. */
export function download(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), RELEASE_AFTER_MS);
}

/**
 * Ouvre dans un nouvel onglet un document chargé après le geste. L'onglet s'ouvre au geste
 * (plus tard, le navigateur le bloquerait), le document y arrive une fois chargé ; un échec
 * referme l'onglet et remonte à l'appelant. Sans onglet (bloqué malgré tout), le document est
 * téléchargé.
 */
export async function openInNewTab(name: string, load: () => Promise<Blob>): Promise<void> {
  const tab = window.open('', '_blank');
  let blob: Blob;
  try {
    blob = await load();
  } catch (error) {
    tab?.close();
    throw error;
  }
  if (!tab) {
    download(new File([blob], name, { type: blob.type }));
    return;
  }
  const url = URL.createObjectURL(blob);
  tab.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), RELEASE_AFTER_MS);
}
