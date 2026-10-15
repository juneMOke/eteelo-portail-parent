import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { fileRefusal } from '../../files/file-type';
import { FileRowComponent } from '../file-row/file-row.component';
import { IconComponent } from '../icon/icon.component';

/**
 * Pièce jointe facultative d'un formulaire : un seul fichier, choisi puis envoyé avec le reste
 * (contrairement à `ui-file-upload`, qui envoie lui-même). Un fichier hors format ou trop
 * lourd est refusé dans le bloc, avant tout envoi.
 */
@Component({
  selector: 'ui-attachment-picker',
  imports: [FileRowComponent, IconComponent],
  templateUrl: './attachment-picker.component.html',
  styleUrl: './attachment-picker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttachmentPickerComponent {
  /** Types MIME acceptés. */
  readonly accept = input.required<readonly string[]>();
  readonly maxBytes = input.required<number>();
  readonly chooseLabel = input('Joindre un fichier');
  /** Rappel sous le bouton, ex. « Photo ou PDF · 5 Mo maximum ». */
  readonly hint = input('');
  readonly formatMessage = input.required<string>();
  readonly tooLargeMessage = input.required<string>();
  /** Pendant l'envoi du formulaire. */
  readonly disabled = input(false);

  readonly file = model<File | null>(null);

  private readonly picker = viewChild.required<ElementRef<HTMLInputElement>>('picker');

  protected readonly refusal = signal<string | null>(null);
  protected readonly acceptAttribute = computed(() => this.accept().join(','));

  protected choose(): void {
    this.picker().nativeElement.click();
  }

  protected picked(event: Event): void {
    const target = event.target as HTMLInputElement;
    const picked = target.files?.[0];
    // Le même fichier doit pouvoir être choisi de nouveau.
    target.value = '';
    if (!picked) return;
    const refusal = fileRefusal([picked], {
      accept: this.accept(),
      maxTotalBytes: this.maxBytes(),
      maxFiles: 1,
    });
    this.refusal.set(
      refusal === 'format' ? this.formatMessage() : refusal ? this.tooLargeMessage() : null,
    );
    if (!refusal) this.file.set(picked);
  }

  protected remove(): void {
    this.refusal.set(null);
    this.file.set(null);
  }
}
