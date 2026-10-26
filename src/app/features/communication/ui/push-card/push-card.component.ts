import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PushStatus } from '../../../../core/push/push.store';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

/**
 * Les notifications de ce téléphone, en tête de Mes messages : une carte qui propose de les
 * activer (la permission du navigateur n'est demandée qu'à l'appui), puis une ligne discrète
 * une fois activées, bloquées, refusées par le serveur (service de push inconnu), ou sur iPhone
 * tant que le portail n'est pas installé. Rien pour
 * `idle` et `hidden` : la page ne la place pas.
 */
@Component({
  selector: 'app-push-card',
  imports: [IconComponent],
  templateUrl: './push-card.component.html',
  styleUrl: './push-card.component.css',
  host: { '[class.offer]': "status() === 'available'" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PushCardComponent {
  readonly status = input.required<PushStatus>();
  /** Activation ou désactivation en cours. */
  readonly busy = input(false);
  /** La dernière activation ou désactivation a échoué. */
  readonly failed = input(false);
  readonly enable = output<void>();
  readonly disable = output<void>();
}
