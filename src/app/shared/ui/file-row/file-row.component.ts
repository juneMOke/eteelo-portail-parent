import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { isPdf } from '../../files/file-type';
import { fileSizeLabel } from '../../format/file-size';
import { IconComponent } from '../icon/icon.component';

/** Un fichier choisi, pas encore envoyé : son type, son nom, son poids, et « Retirer ». */
@Component({
  selector: 'ui-file-row',
  imports: [IconComponent],
  template: `
    <span class="icon"><ui-icon [name]="pdf() ? 'file-text' : 'image'" [size]="18" /></span>
    <span class="file">
      <span class="name">{{ file().name }}</span>
      <span class="meta">{{ size() }}</span>
    </span>
    @if (removable()) {
      <button
        type="button"
        class="remove"
        [attr.aria-label]="'Retirer ' + file().name"
        (click)="remove.emit()"
      >
        <ui-icon name="x" [size]="18" />
      </button>
    }
  `,
  styleUrl: './file-row.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileRowComponent {
  readonly file = input.required<File>();
  /** Masqué pendant l'envoi. */
  readonly removable = input(true);
  readonly remove = output<void>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly pdf = computed(() => isPdf(this.file()));
  protected readonly size = computed(() => fileSizeLabel(this.file().size, this.locale));
}
