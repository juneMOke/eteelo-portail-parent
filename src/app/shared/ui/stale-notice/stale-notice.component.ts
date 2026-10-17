import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

/**
 * Le serveur n'a pas répondu alors que la page s'affichait depuis la mémoire de la session :
 * les données restent lisibles, une ligne discrète dit qu'elles ne sont peut-être plus à jour.
 */
@Component({
  selector: 'ui-stale-notice',
  imports: [IconComponent],
  template: `
    <ui-icon name="wifi-off" [size]="16" [strokeWidth]="2" />
    <span class="text">Pas à jour</span>
    <button type="button" class="retry" (click)="retry.emit()">Réessayer</button>
  `,
  styleUrl: './stale-notice.component.css',
  host: { role: 'status' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaleNoticeComponent {
  readonly retry = output<void>();
}
