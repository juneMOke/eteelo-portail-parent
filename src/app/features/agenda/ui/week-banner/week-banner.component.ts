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
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { RelativeWeek } from '../../data-access/school-week';
import { WeekView } from '../../data-access/week-board';

/**
 * ① Bandeau de semaine, aplat Bleu Ardoise au motif kuba : dit de quelle semaine on parle et
 * passe à la voisine d'un pouce. Au téléphone, une seule ligne ; au grand écran, la bascule
 * Liste / Grille en haut à droite. À la borne, la flèche reste visible à 35 % et garde le
 * focus (`aria-disabled`).
 */
@Component({
  selector: 'app-week-banner',
  imports: [IconComponent],
  templateUrl: './week-banner.component.html',
  styleUrl: './week-banner.component.css',
  host: { '[class.wide]': 'wide()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekBannerComponent {
  /** « Semaine du 21 au 25 septembre 2026 ». */
  readonly label = input.required<string>();
  /** « 21 – 25 sept. ». */
  readonly shortLabel = input.required<string>();
  readonly relative = input.required<RelativeWeek>();
  readonly hasPrevious = input.required<boolean>();
  readonly hasNext = input.required<boolean>();
  readonly isCurrent = input.required<boolean>();
  /** Grand écran : intitulé long, bascule de vue et pastilles. */
  readonly wide = input(false);
  readonly view = input<WeekView>('grid');
  /** Annoncé par les lecteurs d'écran à chaque changement. */
  readonly announcement = input('');

  readonly step = output<1 | -1>();
  readonly current = output<void>();
  readonly viewChange = output<WeekView>();

  private readonly injector = inject(Injector);
  private readonly titleRef = viewChild.required<ElementRef<HTMLElement>>('titleRef');

  protected go(direction: 1 | -1): void {
    if (direction === 1 ? this.hasNext() : this.hasPrevious()) this.step.emit(direction);
  }

  /** La pilule disparaît avec la semaine en cours : le focus passe à l'intitulé. */
  protected goCurrent(): void {
    this.current.emit();
    afterNextRender(() => this.titleRef().nativeElement.focus(), { injector: this.injector });
  }
}
