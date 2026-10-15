import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';

/** Écart horizontal minimal d'un balayage, et dérive verticale tolérée. */
const SWIPE_MIN_X = 60;
const SWIPE_MAX_Y = 40;

/**
 * Région dont le contenu change de période (un jour, une semaine). À chaque changement de
 * `position`, quelle qu'en soit la source (flèche, lien, URL), le contenu glisse de 24 px dans
 * le sens du changement et se fond. Un balayage horizontal émet `swipe` : 1 vers la suite,
 * -1 vers l'arrière ; la page décide où il mène.
 */
@Component({
  selector: 'ui-swipe-pager',
  template: `
    <section
      [attr.aria-label]="label()"
      (touchstart)="onTouchStart($event)"
      (touchend)="onTouchEnd($event)"
    >
      <div class="content" [style.animation-name]="animation()"><ng-content /></div>
    </section>
  `,
  styleUrl: './swipe-pager.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwipePagerComponent {
  /** Position de la période affichée ; l'ordre des chaînes donne le sens (dates `YYYY-MM-DD`). */
  readonly position = input.required<string>();
  /** Nom de la région, ex. « Épreuves du jour ». */
  readonly label = input.required<string>();
  readonly swipe = output<1 | -1>();

  private touchStart: { x: number; y: number } | null = null;

  /** Sens déduit de l'ancienne position ; deux noms d'animation alternés pour la rejouer. */
  private readonly motion = linkedSignal<string, { backward: boolean; odd: boolean }>({
    source: this.position,
    computation: (position, previous) => ({
      backward: !!previous && position < previous.source,
      odd: previous ? !previous.value.odd : false,
    }),
  });
  protected readonly animation = computed(() => {
    const { backward, odd } = this.motion();
    return `slide-in-${backward ? 'backward' : 'forward'}-${odd ? 1 : 0}`;
  });

  protected onTouchStart(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    this.touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  protected onTouchEnd(event: TouchEvent): void {
    const start = this.touchStart;
    const touch = event.changedTouches[0];
    this.touchStart = null;
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    if (Math.abs(dx) < SWIPE_MIN_X || Math.abs(touch.clientY - start.y) > SWIPE_MAX_Y) return;
    this.swipe.emit(dx < 0 ? 1 : -1);
  }
}
