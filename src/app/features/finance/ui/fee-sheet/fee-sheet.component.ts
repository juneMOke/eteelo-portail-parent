import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Fee } from '../../../../core/api/finance.contract';
import { AmountPipe } from '../../../../shared/pipes/amount.pipe';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { SheetComponent } from '../../../../shared/ui/sheet/sheet.component';
import {
  feeMoney,
  feeStatePill,
  feeStateView,
  longDate,
  reductionLabel,
} from '../../data-access/finance-formats';
import { paymentParams, paymentsLink } from '../../data-access/finance-links';
import { feeAllocationRow } from '../../data-access/finance-rows';
import { LedgerRowComponent } from '../ledger-row/ledger-row.component';

/**
 * F La fiche d'un frais, en feuille au téléphone et en panneau de 560 px au-delà : sa pastille
 * d'état, son nom, « catégorie · échéance le 15 septembre 2026 » ; « Le calcul » tel que le
 * serveur le donne (montant, réduction nommée, déjà versé, reste), puis chaque versement reçu,
 * qui ouvre sa fiche dans Mes paiements. « Comment payer » tant qu'il reste quelque chose.
 */
@Component({
  selector: 'app-fee-sheet',
  imports: [AmountPipe, BadgeComponent, IconComponent, LedgerRowComponent, SheetComponent],
  templateUrl: './fee-sheet.component.html',
  styleUrls: ['../finance-sheet.css', './fee-sheet.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeeSheetComponent {
  readonly childId = input.required<string>();
  readonly fee = input.required<Fee | undefined>();
  readonly closed = output<void>();
  readonly pay = output<Fee>();

  private readonly locale = inject(LOCALE_ID);
  private readonly sheet = viewChild.required(SheetComponent);

  protected readonly state = computed(() => {
    const fee = this.fee();
    const view = fee && feeStateView(fee.state);
    return view ? { tone: view.tone, label: feeStatePill(fee, this.locale) } : null;
  });
  /** Le calcul en clair, chaque montant dans la devise du frais. */
  protected readonly money = computed(() => {
    const fee = this.fee();
    if (!fee) return null;
    return {
      gross: feeMoney(fee, fee.grossInCents),
      paid: feeMoney(fee, fee.paidInCents),
      remaining: feeMoney(fee, fee.remainingInCents),
    };
  });
  /** « Frais scolaires · échéance le 15 septembre 2026 ». */
  protected readonly subline = computed(() => {
    const fee = this.fee();
    if (!fee) return null;
    const due = fee.dueDate ? `échéance le ${longDate(fee.dueDate, this.locale)}` : null;
    return [fee.section?.title, due].filter(Boolean).join(' · ') || null;
  });
  protected readonly reduction = computed(() => {
    const reduction = this.fee()?.reduction;
    return reduction ? reductionLabel(reduction, this.locale) : null;
  });
  protected readonly payments = computed(() =>
    (this.fee()?.allocations ?? []).map((allocation) => ({
      id: allocation.paymentId,
      row: feeAllocationRow(allocation, this.locale),
      params: paymentParams(allocation.paymentId),
    })),
  );
  protected readonly paymentsLink = computed(() => paymentsLink(this.childId()));

  open(): void {
    this.sheet().open();
  }

  close(): void {
    this.sheet().close();
  }
}
