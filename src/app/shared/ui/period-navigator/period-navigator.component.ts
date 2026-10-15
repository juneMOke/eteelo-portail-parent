import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { CivilDate, isCivilDate } from '../../date/civil-date';
import { IconComponent } from '../icon/icon.component';

let nextId = 0;

/**
 * Navigateur d'une période (un jour, une semaine) : deux flèches de 44 px, le libellé au centre
 * et sa ligne de contexte ; dessous, le saut de date (sélecteur natif) et le retour à la période
 * courante. Présentation seule : la page dit où mènent les flèches et ce qu'elles valent.
 */
@Component({
  selector: 'ui-period-navigator',
  imports: [IconComponent],
  templateUrl: './period-navigator.component.html',
  styleUrl: './period-navigator.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodNavigatorComponent {
  /** Libellé de la période, ex. « jeudi 24 septembre 2026 » ou « Semaine du 21 au 25 septembre ». */
  readonly label = input.required<string>();
  /** Ligne de contexte sous le libellé, ex. « dans 2 jours · 2 épreuves ». */
  readonly meta = input('');
  readonly previousLabel = input.required<string>();
  readonly nextLabel = input.required<string>();
  readonly hasPrevious = input.required<boolean>();
  readonly hasNext = input.required<boolean>();
  /** Saut de date : valeur affichée et bornes. */
  readonly value = input.required<CivilDate>();
  readonly min = input.required<CivilDate>();
  readonly max = input.required<CivilDate>();
  /** Retour à la période courante, ex. « Aujourd'hui » ou « Cette semaine ». */
  readonly currentLabel = input.required<string>();
  readonly showCurrent = input.required<boolean>();
  /** Annoncé par les lecteurs d'écran à chaque changement de période. */
  readonly announcement = input('');

  readonly step = output<1 | -1>();
  readonly pick = output<CivilDate>();
  readonly current = output<void>();

  private readonly injector = inject(Injector);
  private readonly labelRef = viewChild.required<ElementRef<HTMLElement>>('labelRef');

  protected readonly inputId = `period-jump-${nextId++}`;

  /**
   * Rend le focus au libellé une fois la nouvelle période affichée : à appeler quand le
   * contrôle activé disparaît ou se désactive, pour qu'un lecteur d'écran ne reparte pas du haut.
   */
  focusLabel(): void {
    afterNextRender(() => this.labelRef().nativeElement.focus(), { injector: this.injector });
  }

  protected goCurrent(): void {
    this.current.emit();
    this.focusLabel();
  }

  /** Une date refusée (vide, hors bornes) remet le champ sur la période affichée. */
  protected onPick(event: Event): void {
    const field = event.target as HTMLInputElement;
    if (isCivilDate(field.value) && field.value >= this.min() && field.value <= this.max()) {
      this.pick.emit(field.value);
    } else {
      field.value = this.value();
    }
  }
}
