import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';

/** Écran des pages pas encore livrées ; remplacé au fil des features. */
@Component({
  selector: 'app-coming-soon-page',
  imports: [EmptyStateComponent],
  template: `
    <ui-empty-state
      icon="clock"
      heading="Bientôt disponible"
      message="Cette page arrive dans une prochaine version du portail."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ComingSoonPage {}
