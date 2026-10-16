import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AmountPipe } from '../../../../shared/pipes/amount.pipe';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { FinanceLine } from '../../data-access/finance-rows';

/**
 * Une ligne de frais (④) ou de versement (⑦), sur le modèle de la carte de devoir (spec 03 v2
 * ④) : liseré au ton de l'état, pastille à point, montant à droite en Lora, chevron dans un
 * rond Papier. Toute la ligne ouvre la fiche. Au téléphone, la pastille passe en haut et
 * l'icône disparaît ; au grand écran, la pastille d'un versement passe sous son montant
 * (`aside`). Survol : la ligne monte de 3 px, le liseré devient un contour complet.
 */
@Component({
  selector: 'app-finance-line',
  imports: [AmountPipe, BadgeComponent, IconComponent],
  templateUrl: './finance-line.component.html',
  styleUrl: './finance-line.component.css',
  host: {
    '[class.aside]': '!!line().icon',
    '[style.--edge]': "line().edge ? 'var(--color-tone-' + line().edge + ')' : 'transparent'",
    '[style.--hover-edge]':
      "line().edge ? 'var(--color-tone-' + line().edge + ')' : 'var(--color-border-strong)'",
    '[style.--amount]':
      "line().amountTone ? 'var(--color-tone-' + line().amountTone + ')' : 'var(--color-heading)'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinanceLineComponent {
  readonly line = input.required<FinanceLine>();
  readonly activate = output<void>();
}
