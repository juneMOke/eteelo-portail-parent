import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ICONS, IconName } from './icons';

/** Icône décorative ; le libellé accessible est porté par l'élément parent. */
@Component({
  selector: 'ui-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="size()"
      [attr.height]="size()"
      aria-hidden="true"
      focusable="false"
    >
      @for (path of paths(); track $index) {
        <path [attr.d]="path" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
    svg {
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      /* --icon-stroke permet à un parent d'épaissir le trait (page active du menu). */
      stroke-width: var(--icon-stroke, var(--icon-stroke-default));
    }
  `,
  host: { '[style.--icon-stroke-default]': 'strokeWidth()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  readonly strokeWidth = input(1.8);

  protected readonly paths = computed(() => ICONS[this.name()]);
}
