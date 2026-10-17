import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationProgress } from './navigation-progress';

/**
 * Fine barre Or Doux en haut d'écran pendant une navigation : le geste est pris en compte, inutile
 * de toucher à nouveau. Elle n'apparaît qu'après 120 ms, pour ne pas clignoter sur une page déjà
 * chargée ; décorative, la page annonce elle-même son chargement.
 */
@Component({
  selector: 'app-navigation-progress',
  template: `
    @if (progress.pendingUrl()) {
      <span class="bar"></span>
    }
  `,
  styleUrl: './navigation-progress.component.css',
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationProgressComponent {
  protected readonly progress = inject(NavigationProgress);
}
