import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  viewChildren,
} from '@angular/core';
import { moveRadioFocus } from '../../a11y/radio-focus';

export interface PillOption {
  /** Null est une valeur à part entière (ex. « Tout le trimestre »). */
  readonly id: string | null;
  readonly label: string;
  readonly available: boolean;
  /** Pourquoi l'option est inactive, en infobulle et lu avec elle (« Ouvre le 07/12 »). */
  readonly hint: string | null;
}

let nextId = 0;

/**
 * Groupe radio de pilules de 44 px, nommé par son libellé : la pilule cochée est pleine, une
 * pilule inactive reste visible avec sa raison. Parcours aux flèches ; seule l'option cochée
 * (ou la première active) entre dans l'ordre de tabulation.
 */
@Component({
  selector: 'ui-pill-group',
  templateUrl: './pill-group.component.html',
  styleUrl: './pill-group.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PillGroupComponent {
  readonly label = input.required<string>();
  readonly options = input.required<readonly PillOption[]>();
  /** Option cochée ; undefined si aucune ne l'est. */
  readonly checked = input<string | null | undefined>(undefined);
  readonly pick = output<string | null>();

  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('option');

  protected readonly labelId = `pill-group-${nextId++}`;
  protected readonly focusable = computed(() => {
    const options = this.options();
    const checked = options.findIndex((o) => o.available && o.id === this.checked());
    return checked >= 0 ? checked : options.findIndex((o) => o.available);
  });

  protected choose(option: PillOption): void {
    if (option.available) this.pick.emit(option.id);
  }

  protected move(event: KeyboardEvent, index: number): void {
    moveRadioFocus(
      event,
      index,
      this.buttons().map((button) => button.nativeElement),
    );
  }
}
