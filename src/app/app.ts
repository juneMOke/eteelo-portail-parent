import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationProgressComponent } from './core/navigation/navigation-progress.component';
import { PushStore } from './core/push/push.store';

@Component({
  selector: 'app-root',
  imports: [NavigationProgressComponent, RouterOutlet],
  template: '<app-navigation-progress /><router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // Dès le démarrage : un appui sur une notification est suivi même hors des pages d'enfant.
  private readonly push = inject(PushStore);
}
