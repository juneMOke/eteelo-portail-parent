import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AmountPipe } from '../../../../shared/pipes/amount.pipe';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { FinanceLine } from '../../data-access/finance-rows';

/**
 * Une ligne de frais (E) ou de versement (⑦), sur le modèle de la carte de devoir (spec 03 v2
 * ④) : liseré au ton de l'état, pastille à point, montant à droite en Lora, chevron dans un
 * rond Papier. Toute la ligne ouvre la fiche. Au téléphone, la pastille passe en haut et
 * l'icône disparaît. Au-delà, un frais (`fee`) prend la tuile de sa catégorie au ton de son
 * état, sa pastille au-dessus du montant ; un versement (`aside`) garde l'icône neutre de son
 * moyen et sa pastille sous le montant. Survol : la ligne monte de 3 px, le liseré devient un
 * contour complet.
 */
@Component({
  selector: 'app-finance-line',
  imports: [AmountPipe, BadgeComponent, IconComponent],
  templateUrl: './finance-line.component.html',
  styleUrl: './finance-line.component.css',
  host: {
    '[class.aside]': '!!line().icon && !line().edge',
    '[class.fee]': '!!line().edge',
    '[style.--edge]': "line().edge ? 'var(--color-tone-' + line().edge + ')' : 'transparent'",
    '[style.--edge-soft]':
      "line().edge ? 'var(--color-tone-' + line().edge + '-soft)' : 'var(--color-page)'",
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
