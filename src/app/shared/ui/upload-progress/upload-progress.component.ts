import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Barre d'un envoi en cours, avec sa part en clair ; annoncée une fois aux lecteurs d'écran. */
@Component({
  selector: 'ui-upload-progress',
  template: `
    <progress max="100" [value]="percent()" aria-label="Envoi en cours"></progress>
    <p class="hint" aria-hidden="true">Envoi en cours… {{ percent() }} %</p>
    <p class="visually-hidden" role="status">Envoi en cours</p>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    progress {
      width: 100%;
      height: 8px;
      accent-color: var(--color-accent);
    }
    .hint {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadProgressComponent {
  /** Part envoyée, de 0 à 1. */
  readonly progress = input.required<number>();

  protected readonly percent = computed(() => Math.round(this.progress() * 100));
}
