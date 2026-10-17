import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { Fee } from '../../../../core/api/finance.contract';
import { shortDate } from '../../../../shared/format/day-labels';
import { AmountPipe } from '../../../../shared/pipes/amount.pipe';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { feeMoney, shortFeeLabel } from '../../data-access/finance-formats';

/** Au plus trois frais nommés ; au-delà, un lien vers la liste. */
const VISIBLE_ROWS = 3;

/**
 * D « À payer maintenant », seulement si un frais est en retard (arbitrage B4 : pas d'alerte
 * d'échéance proche en v1, pas de bandeau vert « Tout va bien »). Un seul frais : le titre le
 * nomme. Plusieurs : le titre les compte, la liste en nomme trois, « + n autres frais » mène à
 * la liste. « Comment payer » est le seul accent plein de la page ; aucune pénalité n'est
 * affichée, l'école n'en publie pas.
 */
@Component({
  selector: 'app-overdue-banner',
  imports: [AmountPipe, IconComponent],
  templateUrl: './overdue-banner.component.html',
  styleUrl: './overdue-banner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverdueBannerComponent {
  /** « 1re tranche · 80 $ en retard depuis le 15/09 », « 2 frais · 220 $ à payer ». */
  readonly headline = input.required<string>();
  /** Les frais en retard, dans l'ordre du serveur. */
  readonly fees = input.required<readonly Fee[]>();
  readonly pay = output<void>();
  /** « + n autres frais » : la page mène à la liste. */
  readonly more = output<void>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly rows = computed(() =>
    this.fees().length > 1
      ? this.fees()
          .slice(0, VISIBLE_ROWS)
          .map((fee) => {
            const due = fee.dueDate ? shortDate(fee.dueDate, this.locale) : null;
            return {
              id: fee.feeId,
              name: shortFeeLabel(fee),
              state: due ? `En retard depuis le ${due}` : 'En retard',
              remaining: feeMoney(fee, fee.remainingInCents),
            };
          })
      : [],
  );
  protected readonly others = computed(() => Math.max(this.fees().length - VISIBLE_ROWS, 0));
}
