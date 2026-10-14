import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Bloc fantôme d'un chargement, à la forme du contenu attendu ; ignoré des lecteurs d'écran. */
@Component({
  selector: 'ui-skeleton',
  template: '',
  styles: `
    :host {
      display: block;
      width: var(--skeleton-width);
      height: var(--skeleton-height);
      border-radius: var(--radius-sm);
      background:
        linear-gradient(90deg, transparent 0%, var(--color-surface-soft) 50%, transparent 100%) 0
          0 / 200% 100% no-repeat,
        var(--color-page);
      animation: shimmer 1.4s linear infinite;
    }
    @keyframes shimmer {
      from {
        background-position:
          150% 0,
          0 0;
      }
      to {
        background-position:
          -50% 0,
          0 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host {
        animation: none;
      }
    }
  `,
  host: {
    'aria-hidden': 'true',
    '[style.--skeleton-width]': 'width()',
    '[style.--skeleton-height]': 'height()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  readonly width = input('100%');
  readonly height = input('1rem');
}
