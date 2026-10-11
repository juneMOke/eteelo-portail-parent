import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';
import { Child } from '../../session/bootstrap.schema';
import { childClass, childName, childPhoto } from '../../session/child-format';

/**
 * Feuille « Mes enfants » : feuille basse au téléphone, fenêtre centrée au bureau.
 * Élément <dialog> natif : modal, fermeture par Échap, focus rendu à la pilule à la fermeture.
 * Choix exclusif (groupe radio), flèches pour parcourir, focus sur l'enfant actif à l'ouverture.
 */
@Component({
  selector: 'app-child-picker-sheet',
  imports: [AvatarComponent],
  templateUrl: './child-picker-sheet.component.html',
  styleUrl: './child-picker-sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildPickerSheetComponent {
  readonly children = input.required<readonly Child[]>();
  readonly activeChildId = input.required<string>();
  readonly childSelected = output<string>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly options = viewChildren<ElementRef<HTMLButtonElement>>('option');

  protected readonly name = childName;
  protected readonly className = childClass;
  protected readonly photo = childPhoto;

  open(): void {
    this.dialog().nativeElement.showModal();
    const activeIndex = this.children().findIndex((c) => c.childId === this.activeChildId());
    this.options()[Math.max(activeIndex, 0)]?.nativeElement.focus();
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  protected choose(childId: string): void {
    this.close();
    if (childId !== this.activeChildId()) this.childSelected.emit(childId);
  }

  /** Un clic sur le voile (hors du contenu) ferme la feuille. */
  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.close();
  }

  protected moveFocus(event: KeyboardEvent, index: number): void {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const options = this.options();
    options[(index + step + options.length) % options.length].nativeElement.focus();
  }
}
