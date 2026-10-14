import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CardComponent } from '../card/card.component';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icons';

/** État vide ou indisponible : une icône, un titre, une phrase, et des actions projetées. */
@Component({
  selector: 'ui-empty-state',
  imports: [CardComponent, IconComponent],
  template: `
    <ui-card>
      <span class="icon"><ui-icon [name]="icon()" [size]="24" /></span>
      <h2>{{ heading() }}</h2>
      @if (message()) {
        <p>{{ message() }}</p>
      }
      <ng-content />
    </ui-card>
  `,
  styleUrl: './empty-state.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly heading = input.required<string>();
  readonly message = input<string | null>(null);
  readonly icon = input<IconName>('info');
}
