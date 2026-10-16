import { ChangeDetectionStrategy, Component, computed, input, viewChild } from '@angular/core';
import { Fee } from '../../../../core/api/finance.contract';
import { AmountPipe } from '../../../../shared/pipes/amount.pipe';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { SheetComponent } from '../../../../shared/ui/sheet/sheet.component';
import { feeMoney } from '../../data-access/finance-formats';

/**
 * ③ Comment payer : passer de « je dois » à « je sais comment payer ». En V1 (arbitrage A1),
 * le secrétariat de l'école, en espèces, seul moyen actif ; mobile money et virement sont
 * annoncés, sans numéro ni bouton. Aucune coordonnée n'est saisie dans l'application : le
 * téléphone vient de la fiche école.
 */
@Component({
  selector: 'app-how-to-pay-sheet',
  imports: [AmountPipe, BadgeComponent, IconComponent, SheetComponent],
  templateUrl: './how-to-pay-sheet.component.html',
  styleUrl: './how-to-pay-sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowToPaySheetComponent {
  /** Le frais à régler, quand la feuille s'ouvre depuis sa fiche ; null depuis le bandeau. */
  readonly fee = input<Fee | null>(null);
  /** Téléphone du secrétariat ; null s'il n'est pas saisi. */
  readonly phone = input<string | null>(null);

  private readonly sheet = viewChild.required(SheetComponent);

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
