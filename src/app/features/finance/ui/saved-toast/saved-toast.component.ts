import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

/** Durée d'affichage de la confirmation. */
const SHOWN_FOR_MS = 4_000;

/**
 * La confirmation d'un téléchargement (« Reçu n° ETL-RC-2627-001078 enregistré ») : en bas
 * d'écran, quatre secondes, annoncée par une région `status` toujours présente.
 */
@Component({
  selector: 'app-saved-toast',
  imports: [IconComponent],
  template: `
    @if (message(); as message) {
      <p class="saved">
        <ui-icon name="check-circle" [size]="18" [strokeWidth]="2" />
        {{ message }}
      </p>
    }
  `,
  styleUrl: './saved-toast.component.css',
  host: { role: 'status' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedToastComponent {
  protected readonly message = signal<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly stopTimer = inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));

  show(message: string): void {
    clearTimeout(this.timer);
    this.message.set(message);
    this.timer = setTimeout(() => this.message.set(null), SHOWN_FOR_MS);
  }
}
