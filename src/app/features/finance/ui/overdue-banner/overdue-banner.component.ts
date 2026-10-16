import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Fee } from '../../../../core/api/finance.contract';
import { AmountPipe } from '../../../../shared/pipes/amount.pipe';
import { feeMoney } from '../../data-access/finance-formats';

/**
 * ② « À payer maintenant », seulement si un frais est en retard (pas de bandeau vert « Tout va
 * bien »). Plusieurs frais se déplient. « Comment payer » est le seul accent plein de la page ;
 * aucune pénalité n'est affichée, l'école n'en publie pas.
 */
@Component({
  selector: 'app-overdue-banner',
  imports: [AmountPipe],
  templateUrl: './overdue-banner.component.html',
  styleUrl: './overdue-banner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverdueBannerComponent {
  /** « Frais scolaires · 1re tranche · 80 $ en retard depuis le 15/09 ». */
  readonly headline = input.required<string>();
  /** Les frais en retard, dans l'ordre du serveur. */
  readonly fees = input.required<readonly Fee[]>();
  readonly pay = output<void>();

  protected readonly rows = computed(() =>
    this.fees().map((fee) => ({
      id: fee.feeId,
      label: fee.label,
      remaining: feeMoney(fee, fee.remainingInCents),
    })),
  );
}
