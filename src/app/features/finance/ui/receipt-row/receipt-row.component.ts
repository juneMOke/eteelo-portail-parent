import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { Payment } from '../../../../core/api/finance.contract';
import { AmountPipe } from '../../../../shared/pipes/amount.pipe';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { receiptMeta } from '../../data-access/finance-formats';
import { ReceiptActionsComponent } from '../receipt-actions/receipt-actions.component';

/**
 * ⑩ Un reçu, un document par ligne : pastille de document, son numéro, sa date et son moyen, son
 * montant en Lora, Ouvrir · Partager.
 */
@Component({
  selector: 'app-receipt-row',
  imports: [AmountPipe, IconComponent, ReceiptActionsComponent],
  templateUrl: './receipt-row.component.html',
  styleUrl: './receipt-row.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptRowComponent {
  /** Un versement dont le reçu est scellé. */
  readonly payment = input.required<Payment>();
  readonly href = input.required<string>();
  readonly sharing = input(false);
  readonly share = output<void>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly receiptNumber = computed(() => this.payment().receiptNumber ?? '');
  protected readonly meta = computed(() => receiptMeta(this.payment(), this.locale));
}
