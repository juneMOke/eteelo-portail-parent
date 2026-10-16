import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  viewChildren,
} from '@angular/core';
import { moveRadioFocus } from '../../../../shared/a11y/radio-focus';
import { FilterOption } from '../../data-access/week-board';

/**
 * ③ Un filtre en rangée de pastilles, dans le bandeau du grand écran : active crème, compteur
 * en rond bleu ; inactives translucides à filet clair. Groupe radio, parcours aux flèches.
 */
@Component({
  selector: 'app-filter-pills',
  templateUrl: './filter-pills.component.html',
  styleUrl: './filter-pills.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPillsComponent {
  /** Nom du groupe, lu par les lecteurs d'écran : « Filtrer par jour ». */
  readonly label = input.required<string>();
  readonly options = input.required<readonly FilterOption[]>();
  readonly checked = input.required<string | null>();
  readonly pick = output<string | null>();

  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('option');

  protected readonly focusable = computed(() =>
    Math.max(
      0,
      this.options().findIndex((option) => option.id === this.checked()),
    ),
  );

  protected move(event: KeyboardEvent, index: number): void {
    moveRadioFocus(
      event,
      index,
      this.buttons().map((button) => button.nativeElement),
    );
  }
}
