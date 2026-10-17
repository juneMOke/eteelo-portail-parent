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
import { Payment } from '../../../../core/api/finance.contract';
import { amountsLabel } from '../../../../shared/format/amount';
import { countLabel } from '../../../../shared/format/count';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { CopyButtonComponent } from '../../../../shared/ui/copy-button/copy-button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { SheetComponent } from '../../../../shared/ui/sheet/sheet.component';
import {
  methodView,
  paidAtLabel,
  payerName,
  paymentTitle,
  receiptLabel,
  receivedLabel,
} from '../../data-access/finance-formats';
import { feeParams, feesLink } from '../../data-access/finance-links';
import { paymentAllocationRow } from '../../data-access/finance-rows';
import { LedgerRowComponent } from '../ledger-row/ledger-row.component';
import { ReceiptActionsComponent } from '../receipt-actions/receipt-actions.component';

/**
 * E La fiche d'un versement (spec 07 « Mes paiements · détail »), en feuille au téléphone et en
 * panneau de 560 px au-delà : pastille « Enregistré », montant imputé en titre, jour et heure ;
 * « Le versement » (moyen, référence copiable, payeur, perçu au guichet quand il diffère) ;
 * « Imputé sur », chaque frais ouvrant sa fiche dans Mes frais ; en pied, le reçu à ouvrir dans
 * un onglet ou à partager, ou « Reçu en préparation ». Elle se lit sous son titre de ligne
 * (« Mardi 22/09 · Mobile money ») plutôt que sous son montant.
 */
@Component({
  selector: 'app-payment-sheet',
  imports: [
    BadgeComponent,
    CopyButtonComponent,
    IconComponent,
    LedgerRowComponent,
    ReceiptActionsComponent,
    SheetComponent,
  ],
  templateUrl: './payment-sheet.component.html',
  styleUrls: ['../finance-sheet.css', './payment-sheet.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentSheetComponent {
  readonly childId = input.required<string>();
  readonly payment = input.required<Payment | undefined>();
  /** Le reçu scellé du versement ; null tant qu'il n'est pas émis. */
  readonly receiptHref = input<string | null>(null);
  /** Le reçu se charge pour être partagé. */
  readonly sharing = input(false);
  /** Ce qui a empêché de partager le reçu. */
  readonly failure = input<string | null>(null);
  readonly closed = output<void>();
  readonly share = output<Payment>();

  private readonly locale = inject(LOCALE_ID);
  private readonly sheet = viewChild.required(SheetComponent);

  protected readonly view = computed(() => {
    const payment = this.payment();
    if (!payment) return null;
    return {
      amount: amountsLabel(payment.amounts, this.locale),
      title: paymentTitle(payment, this.locale),
      paidAt: paidAtLabel(payment, this.locale),
      method: methodView(payment.method).label,
      payer: payerName(payment),
      received: receivedLabel(payment.received, this.locale),
      receipt: payment.receiptNumber ? receiptLabel(payment.receiptNumber) : null,
      /** « 1 frais », « 2 frais ». */
      feesCount: countLabel(payment.allocations.length, 'frais', 'frais', ''),
      fees: payment.allocations.map((allocation) => ({
        id: allocation.feeId,
        row: paymentAllocationRow(allocation, this.locale),
        params: feeParams(allocation.feeId),
      })),
    };
  });
  protected readonly feesLink = computed(() => feesLink(this.childId()));

  open(): void {
    this.sheet().open();
  }

  close(): void {
    this.sheet().close();
  }
}
