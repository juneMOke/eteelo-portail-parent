import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  input,
  output,
  viewChild,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

let nextId = 0;

/**
 * Feuille de choix : feuille basse au téléphone, fenêtre centrée au bureau. Élément <dialog>
 * natif : modal, fermeture par Échap ou par le voile, focus rendu au déclencheur à la
 * fermeture. Le contenu est projeté ; la page place le focus à l'ouverture. En option : un
 * bouton ✕ (`dismissible`), une flèche de retour (`backLabel`), une pastille au-dessus du titre
 * (`[sheetLead]`), un sous-titre (`[sheetSub]`) et un nom lu distinct du titre (`label`). La largeur au bureau se règle par
 * `--sheet-width`.
 */
@Component({
  selector: 'ui-sheet',
  imports: [IconComponent],
  template: `
    <!-- Clic sur le fond : au clavier, Échap ferme le dialog nativement. -->
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
    <dialog
      #dialog
      [attr.aria-labelledby]="label() ? null : headingId"
      [attr.aria-label]="label()"
      (click)="closeOnBackdrop($event)"
      (close)="closed.emit()"
    >
      <div class="sheet">
        <span class="handle" aria-hidden="true"></span>
        <div class="head">
          @if (backLabel(); as label) {
            <button
              type="button"
              class="round back"
              [attr.aria-label]="label"
              (click)="back.emit()"
            >
              <ui-icon name="arrow-left" [size]="18" [strokeWidth]="2" />
            </button>
          }
          <div class="titles">
            <ng-content select="[sheetLead]" />
            <h2 [id]="headingId">{{ heading() }}</h2>
            <ng-content select="[sheetSub]" />
          </div>
          @if (dismissible()) {
            <button type="button" class="round close" aria-label="Fermer" (click)="close()">
              <ui-icon name="x" [size]="18" [strokeWidth]="2" />
            </button>
          }
        </div>
        <ng-content />
      </div>
    </dialog>
  `,
  styleUrl: './sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SheetComponent {
  readonly heading = input.required<string>();
  /** Nom lu de la feuille, quand le titre affiché ne la nomme pas (un montant) ; null, le titre. */
  readonly label = input<string | null>(null);
  /** Bouton ✕ « Fermer » en haut à droite. */
  readonly dismissible = input(false, { transform: booleanAttribute });
  /** Nom lu de la flèche de retour ; null, pas de flèche. */
  readonly backLabel = input<string | null>(null);
  readonly closed = output<void>();
  readonly back = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly headingId = `sheet-title-${nextId++}`;

  /** Sans effet sur une feuille déjà ouverte. */
  open(): void {
    const dialog = this.dialog().nativeElement;
    if (!dialog.open) dialog.showModal();
  }

  close(): void {
    const dialog = this.dialog().nativeElement;
    if (dialog.open) dialog.close();
  }

  /** Un clic sur le voile (hors du contenu) ferme la feuille. */
  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.close();
  }
}
