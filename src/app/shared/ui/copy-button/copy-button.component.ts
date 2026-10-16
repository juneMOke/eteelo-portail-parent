import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';

/** Temps pendant lequel le bouton dit « Copié ». */
const CONFIRMATION_MS = 2000;

/**
 * Copie un texte (une référence, un numéro) dans le presse-papiers en un geste. Le libellé
 * devient « Copié » deux secondes, annoncé sans toast.
 */
@Component({
  selector: 'ui-copy-button',
  template: `
    <button
      type="button"
      class="button secondary"
      [attr.aria-label]="copied() ? 'Copié' : label()"
      (click)="copy()"
    >
      <span aria-live="polite">{{ copied() ? 'Copié' : 'Copier' }}</span>
    </button>
  `,
  styles: `
    button {
      padding: 0 var(--space-3);
      font-size: var(--text-sm);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyButtonComponent {
  readonly text = input.required<string>();
  /** Nom du bouton, ex. « Copier la référence ». */
  readonly label = input('Copier');

  protected readonly copied = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.text());
    this.copied.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.copied.set(false), CONFIRMATION_MS);
  }
}
