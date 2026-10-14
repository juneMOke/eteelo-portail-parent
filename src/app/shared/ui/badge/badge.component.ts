import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Tone } from '../tone';

/** Pastille de statut : un mot sur fond doux, à la couleur de son ton. */
@Component({
  selector: 'ui-badge',
  template: '<ng-content />',
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: var(--radius-pill);
      background: var(--badge-bg);
      color: var(--badge-fg);
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      line-height: 1.3;
      white-space: nowrap;
    }
    :host(.solid) {
      background: var(--color-on-tone);
    }
  `,
  host: {
    '[class.solid]': 'onTone()',
    '[style.--badge-bg]': "'var(--color-tone-' + tone() + '-soft)'",
    '[style.--badge-fg]': "'var(--color-tone-' + tone() + ')'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  readonly tone = input<Tone>('neutral');
  /** Posée sur un aplat du même ton : fond crème plein pour rester lisible. */
  readonly onTone = input(false);
}
