import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationProgressComponent } from './core/navigation/navigation-progress.component';

@Component({
  selector: 'app-root',
  imports: [NavigationProgressComponent, RouterOutlet],
  template: '<app-navigation-progress /><router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
