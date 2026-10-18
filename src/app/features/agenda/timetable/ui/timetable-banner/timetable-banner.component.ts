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
import { CivilDate } from '../../../../../core/api/assignments.contract';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';

export type TimetableView = 'day' | 'week';

/** Une pastille de la bande des jours (C6). */
export interface StripDay {
  readonly date: CivilDate;
  /** « Lun ». */
  readonly weekday: string;
  /** « 22 ». */
  readonly number: string;
  /** « Lundi 22 septembre 2026 », pour les lecteurs d'écran. */
  readonly spoken: string;
  readonly selected: boolean;
  readonly today: boolean;
}

/**
 * Bandeau de navigation de Mon emploi du temps (spec 04 · détail, section C) : l'aplat Bleu
 * Ardoise des autres pages, au pas d'un jour d'école ou d'une semaine. Bascule Jour · Semaine au
 * grand écran seulement, bande des jours en vue jour. À la borne, la flèche reste visible à 35 %
 * et garde le focus (`aria-disabled`).
 */
@Component({
  selector: 'app-timetable-banner',
  imports: [IconComponent],
  templateUrl: './timetable-banner.component.html',
  styleUrl: './timetable-banner.component.css',
  host: { '[class.wide]': 'wide()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimetableBannerComponent {
  /** « Mardi 22 septembre 2026 », « Semaine du 21 au 25 septembre » (C3). */
  readonly title = input.required<string>();
  /** « Aujourd'hui · 5 cours · 7 h 30 à 11 h 45 » (C4). */
  readonly summary = input.required<string>();
  readonly view = input.required<TimetableView>();
  /** Grand écran : la bascule Jour · Semaine (C1). */
  readonly wide = input(false);
  readonly hasPrevious = input.required<boolean>();
  readonly hasNext = input.required<boolean>();
  /** « Revenir à aujourd'hui » ; null quand on y est déjà (C5). */
  readonly currentLabel = input<string | null>(null);
  /** Bande des jours, en vue jour seulement (C6). */
  readonly strip = input<readonly StripDay[]>([]);
  /** Annoncé par les lecteurs d'écran à chaque changement. */
  readonly announcement = input('');

  readonly step = output<1 | -1>();
  readonly current = output<void>();
  readonly viewChange = output<TimetableView>();
  readonly pick = output<CivilDate>();

  private readonly injector = inject(Injector);
  private readonly titleRef = viewChild.required<ElementRef<HTMLElement>>('titleRef');

  protected go(direction: 1 | -1): void {
    if (direction === 1 ? this.hasNext() : this.hasPrevious()) this.step.emit(direction);
  }

  /** La pilule disparaît avec le retour : le focus passe à l'intitulé. */
  protected goCurrent(): void {
    this.current.emit();
    afterNextRender(() => this.titleRef().nativeElement.focus(), { injector: this.injector });
  }
}
