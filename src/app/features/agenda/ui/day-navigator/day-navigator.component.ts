import { DatePipe, formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  LOCALE_ID,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { AssignmentWindow, CivilDate } from '../../../../core/api/assignments.contract';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import {
  civilToDate,
  inWindow,
  isCivilDate,
  relativeDay,
  stepSchoolDay,
} from '../../data-access/school-days';

let nextId = 0;

/**
 * ① Navigateur de jour et ② saut de date. Deux flèches qui vont de jour d'école en jour
 * d'école, la date en toutes lettres, sa position relative, le résumé du jour ; dessous, le
 * sélecteur natif de l'appareil et « Aujourd'hui ». Borné par la fenêtre rendue par le serveur.
 */
@Component({
  selector: 'app-day-navigator',
  imports: [DatePipe, IconComponent],
  templateUrl: './day-navigator.component.html',
  styleUrl: './day-navigator.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayNavigatorComponent {
  readonly day = input.required<CivilDate>();
  readonly window = input.required<AssignmentWindow>();
  /** Résumé du jour, ex. « 2 épreuves » ou « Pas d'école ». */
  readonly summary = input.required<string>();
  readonly dayChange = output<CivilDate>();

  private readonly locale = inject(LOCALE_ID);
  private readonly injector = inject(Injector);
  private readonly dateLabel = viewChild.required<ElementRef<HTMLElement>>('dateLabel');

  protected readonly inputId = `day-jump-${nextId++}`;
  protected readonly date = computed(() => civilToDate(this.day()));
  protected readonly previous = computed(() => stepSchoolDay(this.day(), -1, this.window()));
  protected readonly next = computed(() => stepSchoolDay(this.day(), 1, this.window()));
  protected readonly relative = computed(() => relativeDay(this.day(), this.window().today));
  protected readonly showToday = computed(
    () => this.day() !== this.window().today && inWindow(this.window().today, this.window()),
  );
  /** Annoncé à chaque changement de jour : « Vendredi 25 septembre, 2 épreuves ». */
  protected readonly announcement = computed(() => {
    const day = formatDate(this.date(), 'EEEE d MMMM', this.locale, 'UTC');
    return `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${this.summary()}`;
  });

  /**
   * Rend le focus à la date une fois le nouveau jour affiché : à appeler quand le contrôle
   * activé disparaît ou se désactive, pour qu'un lecteur d'écran ne reparte pas du haut.
   */
  focusDate(): void {
    afterNextRender(() => this.dateLabel().nativeElement.focus(), { injector: this.injector });
  }

  /** Flèche : à la borne, elle se désactive et perd le focus ; on le rend à la date. */
  protected step(direction: 1 | -1): void {
    const target = direction === 1 ? this.next() : this.previous();
    if (!target) return;
    this.dayChange.emit(target);
    if (!stepSchoolDay(target, direction, this.window())) this.focusDate();
  }

  /** « Aujourd'hui » disparaît une fois le jour atteint. */
  protected goToday(): void {
    this.dayChange.emit(this.window().today);
    this.focusDate();
  }

  /** Une date refusée (vide, hors fenêtre) remet le champ sur le jour affiché. */
  protected pick(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (isCivilDate(input.value) && inWindow(input.value, this.window())) {
      this.dayChange.emit(input.value);
    } else {
      input.value = this.day();
    }
  }
}
