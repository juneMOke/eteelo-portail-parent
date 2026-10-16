import { fileTypeOf } from './file-type';

/** Côté le plus long d'une photo envoyée : assez pour lire un certificat. */
const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.8;
/** En dessous, la photo part telle quelle. */
const LIGHT_BYTES = 600_000;

/**
 * Réduit une photo avant l'envoi : une photo de téléphone dépasse souvent 5 Mo, et le parent
 * paie ses données en 3G. JPEG de 1 600 px au plus. Un PDF, une photo déjà légère, ou un
 * navigateur qui ne sait pas la décoder, partent tels quels : le serveur reste juge du poids.
 */
export async function downscaleImage(file: File): Promise<File> {
  const type = fileTypeOf(file);
  if (!type.startsWith('image/') || file.size <= LIGHT_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
