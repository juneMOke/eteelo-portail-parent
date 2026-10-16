import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { FilterOption } from '../../data-access/week-board';

let nextId = 0;

/**
 * ③ Un filtre en menu déroulant, sous le bandeau du téléphone : un déclencheur de 48 px (petit
 * intitulé, valeur active, compteur), puis une liste sur mesure ancrée sous lui. Pas de
 * sélecteur natif : il ne porte ni couleur, ni compteur, ni séparateur. L'option active est en
 * bleu clair avec une coche, jamais à la couleur du statut. La page garantit qu'un seul menu
 * est ouvert à la fois (`open`).
 */
@Component({
  selector: 'app-filter-menu',
  imports: [IconComponent],
  templateUrl: './filter-menu.component.html',
  styleUrl: './filter-menu.component.css',
  host: { '[class.open]': 'open()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterMenuComponent {
  /** « Filtrer par jour ». */
  readonly caption = input.required<string>();
  readonly options = input.required<readonly FilterOption[]>();
  readonly checked = input.required<string | null>();
  readonly open = input(false);
  readonly pick = output<string | null>();
  readonly openChange = output<boolean>();

  private readonly injector = inject(Injector);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly listbox = viewChild<ElementRef<HTMLElement>>('listbox');

  protected readonly id = `filter-menu-${nextId++}`;
  protected readonly selected = computed(
    () => this.options().find((option) => option.id === this.checked()) ?? this.options()[0],
  );
  /** Option sous le curseur clavier, annoncée par `aria-activedescendant` ; part de l'active. */
  protected readonly active = linkedSignal(() =>
    Math.max(0, this.options().indexOf(this.selected())),
  );

  protected toggle(): void {
    if (this.open()) {
      this.openChange.emit(false);
      return;
    }
    this.openChange.emit(true);
    afterNextRender(() => this.listbox()?.nativeElement.focus(), { injector: this.injector });
  }

  protected choose(option: FilterOption): void {
    this.pick.emit(option.id);
    this.close();
  }

  /** Ferme et rend le focus au déclencheur. */
  protected close(): void {
    this.openChange.emit(false);
    this.trigger().nativeElement.focus();
  }

  protected onKey(event: KeyboardEvent): void {
    const count = this.options().length;
    switch (event.key) {
      case 'ArrowDown':
        this.active.update((index) => (index + 1) % count);
        break;
      case 'ArrowUp':
        this.active.update((index) => (index - 1 + count) % count);
        break;
      case 'Home':
        this.active.set(0);
        break;
      case 'End':
        this.active.set(count - 1);
        break;
      case 'Enter':
      case ' ':
        this.choose(this.options()[this.active()]);
        break;
      case 'Escape':
        this.close();
        break;
      case 'Tab':
        this.openChange.emit(false);
        return;
      default:
        return;
    }
    event.preventDefault();
  }
}
