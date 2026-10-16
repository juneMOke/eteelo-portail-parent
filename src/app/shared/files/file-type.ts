/** Extensions reconnues quand le téléphone ne donne pas le type du fichier. */
const EXTENSION_TYPES: Readonly<Record<string, string>> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

/** Type MIME d'un fichier choisi, déduit de son extension quand le téléphone le tait. */
export function fileTypeOf(file: File): string {
  if (file.type) return file.type.toLowerCase();
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TYPES[extension] ?? '';
}

export function isPdf(file: File): boolean {
  return fileTypeOf(file) === 'application/pdf';
}

/** Règles d'un dépôt, vérifiées avant l'envoi. */
export interface FileRules {
  /** Types MIME acceptés. */
  readonly accept: readonly string[];
  /** Poids maximal de tout le dépôt, en octets. */
  readonly maxTotalBytes: number;
  readonly maxFiles: number;
}

/** Ce qui fait refuser une sélection avant l'envoi ; null si elle passe. */
export type FileRefusal = 'format' | 'count' | 'size';

export function fileRefusal(files: readonly File[], rules: FileRules): FileRefusal | null {
  if (files.some((file) => !rules.accept.includes(fileTypeOf(file)))) return 'format';
  if (files.length > rules.maxFiles) return 'count';
  const total = files.reduce((sum, file) => sum + file.size, 0);
  return total > rules.maxTotalBytes ? 'size' : null;
}
