import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Fee } from '../../../../core/api/finance.contract';
import { AmountPipe } from '../../../../shared/pipes/amount.pipe';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { SheetComponent } from '../../../../shared/ui/sheet/sheet.component';
import { feeMoney, shortFeeLabel } from '../../data-access/finance-formats';

/**
 * G Comment payer : passer de « je dois » à « je sais comment payer ». Le montant à verser (le
 * reste du frais, ou le retard par devise tel que le serveur le donne), puis les moyens acceptés.
 * En V1 (arbitrage A1), le secrétariat de l'école, en espèces, seul moyen actif ; mobile money et
 * virement sont annoncés, sans opérateur, numéro ni bouton. Ni référence ni « J'ai payé » : le
 * portail est en lecture seule. Ouverte depuis la fiche d'un frais, une flèche y ramène.
 */
@Component({
  selector: 'app-how-to-pay-sheet',
  imports: [AmountPipe, BadgeComponent, IconComponent, SheetComponent],
  templateUrl: './how-to-pay-sheet.component.html',
  styleUrl: './how-to-pay-sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowToPaySheetComponent {
  /** Le frais à régler (sa fiche, ou le seul frais en retard) ; null pour plusieurs frais. */
  readonly fee = input<Fee | null>(null);
  /** Sans frais nommé : le reste en retard par devise, « 220 $ ». */
  readonly overdueAmount = input<string | null>(null);
  readonly childName = input<string | null>(null);
  /** Téléphone du secrétariat ; null s'il n'est pas saisi. */
  readonly phone = input<string | null>(null);
  /** Ouverte depuis la fiche du frais : la flèche de retour y ramène. */
  readonly fromFee = input(false);
  readonly back = output<void>();

  private readonly sheet = viewChild.required(SheetComponent);

  /** « 1re tranche · Josué », « Frais en retard · Josué ». */
  protected readonly subtitle = computed(() => {
    const fee = this.fee();
    return [fee ? shortFeeLabel(fee) : 'Frais en retard', this.childName()]
      .filter(Boolean)
      .join(' · ');
  });
  protected readonly remaining = computed(() => {
    const fee = this.fee();
    return fee ? feeMoney(fee, fee.remainingInCents) : null;
  });

  protected readonly upcoming = [
    { label: 'Mobile money', icon: 'smartphone' },
    { label: 'Virement bancaire', icon: 'landmark' },
  ] as const;

  open(): void {
    this.sheet().open();
  }

  close(): void {
    this.sheet().close();
  }
}
