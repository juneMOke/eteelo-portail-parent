import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

let nextId = 0;

/**
 * Feuille de choix : feuille basse au téléphone, fenêtre centrée au bureau. Élément <dialog>
 * natif : modal, fermeture par Échap ou par le voile, focus rendu au déclencheur à la
 * fermeture. Le contenu est projeté ; la page place le focus à l'ouverture.
 */
@Component({
  selector: 'ui-sheet',
  template: `
    <dialog
      #dialog
      [attr.aria-labelledby]="headingId"
      (click)="closeOnBackdrop($event)"
      (close)="closed.emit()"
    >
      <div class="sheet">
        <span class="handle" aria-hidden="true"></span>
        <h2 [id]="headingId">{{ heading() }}</h2>
        <ng-content />
      </div>
    </dialog>
  `,
  styleUrl: './sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SheetComponent {
  readonly heading = input.required<string>();
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly headingId = `sheet-title-${nextId++}`;

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  /** Un clic sur le voile (hors du contenu) ferme la feuille. */
  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.close();
  }
}
