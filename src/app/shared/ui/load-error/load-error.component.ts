import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { EmptyStateComponent } from '../empty-state/empty-state.component';

/** Échec de chargement d'une page : ce qui manque, pourquoi, et « Réessayer ». */
@Component({
  selector: 'ui-load-error',
  imports: [EmptyStateComponent],
  template: `
    <ui-empty-state icon="info" [heading]="heading()" [message]="message()">
      <button type="button" class="button" (click)="retry.emit()">Réessayer</button>
    </ui-empty-state>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadErrorComponent {
  /** « Impossible d'afficher les notes ». */
  readonly heading = input.required<string>();
  readonly message = input('Vérifiez votre connexion, puis réessayez.');
  readonly retry = output<void>();
}
