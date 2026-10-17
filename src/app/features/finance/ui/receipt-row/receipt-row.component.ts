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
import { receiptFees, receiptMeta, recordedOnLabel } from '../../data-access/finance-formats';
import { ReceiptActionsComponent } from '../receipt-actions/receipt-actions.component';

/**
 * D Un reçu, un document par ligne : tuile de document (au-delà du téléphone), « Reçu n° … »,
 * « Lun. 22 sept. · Mobile money · 2e tranche » (sans le frais au téléphone), le montant en
 * Lora, Ouvrir · Partager. La ligne elle-même ne se touche pas : deux gestes de même poids. Un
 * reçu pas encore scellé se dit « Reçu en préparation », filet pointillé, et « Versement
 * enregistré le 26/09 » à la place des boutons.
 */
@Component({
  selector: 'app-receipt-row',
  imports: [AmountPipe, IconComponent, ReceiptActionsComponent],
  templateUrl: './receipt-row.component.html',
  styleUrl: './receipt-row.component.css',
  host: { '[class.pending]': '!receiptNumber()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptRowComponent {
  readonly payment = input.required<Payment>();
  /** Le PDF du reçu ; ignoré tant qu'il n'est pas scellé. */
  readonly href = input.required<string>();
  readonly sharing = input(false);
  readonly share = output<void>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly receiptNumber = computed(() => this.payment().receiptNumber);
  protected readonly meta = computed(() => receiptMeta(this.payment(), this.locale));
  protected readonly fees = computed(() => receiptFees(this.payment()));
  protected readonly recordedOn = computed(() => recordedOnLabel(this.payment(), this.locale));
}
