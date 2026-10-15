import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  LOCALE_ID,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { fileSizeLabel } from '../../format/file-size';
import { IconComponent } from '../icon/icon.component';

/** Pourquoi le dernier envoi n'a pas abouti, et s'il vaut la peine de le relancer tel quel. */
export interface UploadFailure {
  readonly message: string;
  readonly retryable: boolean;
}

/** Extensions reconnues quand le téléphone ne donne pas le type du fichier. */
const EXTENSION_TYPES: Readonly<Record<string, string>> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

/** Délai pendant lequel un second appui sur « Envoyer » est ignoré. */
const DOUBLE_TAP_MS = 600;

function typeOf(file: File): string {
  if (file.type) return file.type.toLowerCase();
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TYPES[extension] ?? '';
}

/**
 * Choix puis envoi d'un ou plusieurs fichiers, en un seul dépôt. Choisir n'est pas envoyer :
 * la sélection s'affiche (nom, poids) avec « Envoyer », « Ajouter une page » et « Changer ».
 * Les fichiers hors format ou trop lourds sont refusés avant l'envoi, dans le bloc. Pendant
 * l'envoi, la progression vient du parent (`progress`) ; l'échec aussi (`failure`). Hors
 * connexion, le choix est indisponible plutôt que d'échouer après coup.
 */
@Component({
  selector: 'ui-file-upload',
  imports: [IconComponent],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadComponent {
  /** Types MIME acceptés. */
  readonly accept = input.required<readonly string[]>();
  /** Poids maximal de tout le dépôt, en octets. */
  readonly maxTotalBytes = input.required<number>();
  readonly maxFiles = input(20);
  readonly chooseLabel = input('Choisir un fichier');
  /** Rappel sous le bouton, ex. « PDF ou photo · 10 Mo maximum ». */
  readonly hint = input('');
  readonly formatMessage = input.required<string>();
  readonly tooLargeMessage = input.required<string>();
  readonly tooManyMessage = input.required<string>();
  /** Part envoyée, de 0 à 1 ; null hors envoi. */
  readonly progress = input<number | null>(null);
  readonly failure = input<UploadFailure | null>(null);

  /** Les fichiers choisis, dans l'ordre des pages. Vidée par le parent après un envoi réussi. */
  readonly files = model<readonly File[]>([]);
  readonly send = output<readonly File[]>();

  private readonly locale = inject(LOCALE_ID);
  private readonly picker = viewChild.required<ElementRef<HTMLInputElement>>('picker');

  protected readonly online = signal(navigator.onLine);
  /** Refus avant l'envoi : format ou poids. */
  protected readonly refusal = signal<string | null>(null);
  private appending = false;
  private lastSend = 0;

  protected readonly acceptAttribute = computed(() => this.accept().join(','));
  protected readonly sending = computed(() => this.progress() !== null);
  /** Un refus terminal ne propose pas de renvoyer les mêmes fichiers. */
  protected readonly canSend = computed(() => this.failure()?.retryable ?? true);
  protected readonly percent = computed(() => Math.round((this.progress() ?? 0) * 100));
  protected readonly selection = computed(() =>
    this.files().map((file) => ({
      file,
      isPdf: typeOf(file) === 'application/pdf',
      size: fileSizeLabel(file.size, this.locale),
    })),
  );
  protected readonly totalSize = computed(() =>
    fileSizeLabel(
      this.files().reduce((total, file) => total + file.size, 0),
      this.locale,
    ),
  );

  constructor() {
    const update = () => this.online.set(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    });
  }

  protected choose(append: boolean): void {
    this.appending = append;
    this.picker().nativeElement.click();
  }

  protected picked(event: Event): void {
    const target = event.target as HTMLInputElement;
    const picked = [...(target.files ?? [])];
    // Le même fichier doit pouvoir être choisi de nouveau.
    target.value = '';
    if (!picked.length) return;

    const next = this.appending ? [...this.files(), ...picked] : picked;
    const refusal = this.check(next);
    this.refusal.set(refusal);
    if (!refusal) this.files.set(next);
  }

  protected submit(): void {
    const now = Date.now();
    if (this.sending() || now - this.lastSend < DOUBLE_TAP_MS) return;
    this.lastSend = now;
    this.send.emit(this.files());
  }

  protected remove(index: number): void {
    this.refusal.set(null);
    this.files.update((files) => files.filter((_, i) => i !== index));
  }

  private check(files: readonly File[]): string | null {
    const accepted = this.accept();
    if (files.some((file) => !accepted.includes(typeOf(file)))) return this.formatMessage();
    if (files.length > this.maxFiles()) return this.tooManyMessage();
    const total = files.reduce((sum, file) => sum + file.size, 0);
    return total > this.maxTotalBytes() ? this.tooLargeMessage() : null;
  }
}
