import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import { moveRadioFocus } from '../../../shared/a11y/radio-focus';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';
import { SheetComponent } from '../../../shared/ui/sheet/sheet.component';
import { Child } from '../../session/bootstrap.schema';
import { childClass, childName, childPhoto } from '../../session/child-format';

/**
 * Feuille « Mes enfants » : feuille basse au téléphone, fenêtre centrée au bureau.
 * Choix exclusif (groupe radio), flèches pour parcourir, focus sur l'enfant actif à l'ouverture.
 */
@Component({
  selector: 'app-child-picker-sheet',
  imports: [AvatarComponent, SheetComponent],
  templateUrl: './child-picker-sheet.component.html',
  styleUrl: './child-picker-sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildPickerSheetComponent {
  readonly children = input.required<readonly Child[]>();
  readonly activeChildId = input.required<string>();
  readonly childSelected = output<string>();

  private readonly sheet = viewChild.required(SheetComponent);
  private readonly options = viewChildren<ElementRef<HTMLButtonElement>>('option');

  protected readonly name = childName;
  protected readonly className = childClass;
  protected readonly photo = childPhoto;

  open(): void {
    this.sheet().open();
    const activeIndex = this.children().findIndex((c) => c.childId === this.activeChildId());
    this.options()[Math.max(activeIndex, 0)]?.nativeElement.focus();
  }

  close(): void {
    this.sheet().close();
  }

  protected choose(childId: string): void {
    this.close();
    if (childId !== this.activeChildId()) this.childSelected.emit(childId);
  }

  protected moveFocus(event: KeyboardEvent, index: number): void {
    moveRadioFocus(
      event,
      index,
      this.options().map((option) => option.nativeElement),
    );
  }
}
