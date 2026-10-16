import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Payment } from '../../../core/api/finance.contract';
import { countLabel } from '../../../shared/format/count';
import { injectQueryParamSheet } from '../../../shared/navigation/query-param-sheet';
import { latestValue } from '../../../shared/resource/latest-value';
import { EmptyPeriodComponent } from '../../../shared/ui/empty-period/empty-period.component';
import { LoadErrorComponent } from '../../../shared/ui/load-error/load-error.component';
import { SectionCardComponent } from '../../../shared/ui/section-card/section-card.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { FinanceDocumentsStore, receiptKey } from '../data-access/finance-documents.store';
import { paymentMonths } from '../data-access/finance-formats';
import { feesLink } from '../data-access/finance-links';
import { paymentLine } from '../data-access/finance-rows';
import { FinanceFacade } from '../data-access/finance.facade';
import { FinanceLineComponent } from '../ui/finance-line/finance-line.component';
import { PaymentSheetComponent } from '../ui/payment-sheet/payment-sheet.component';

/**
 * Mes paiements : « c'est arrivé ? ». Le journal des versements de l'année, par mois, le plus
 * récent en haut, une carte par mois (⑥, ⑦). La fiche d'un versement (⑧) vit dans l'URL (`?payment=`) : un frais
 * de Mes frais y mène, et le retour la rouvre. Pas de bilan ici : il est dans Mes frais.
 */
@Component({
  selector: 'app-payments-page',
  imports: [
    EmptyPeriodComponent,
    FinanceLineComponent,
    LoadErrorComponent,
    PaymentSheetComponent,
    SectionCardComponent,
    SkeletonComponent,
  ],
  templateUrl: './payments.page.html',
  styleUrl: '../finance-page.css',
  providers: [FinanceDocumentsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PaymentsPage {
  readonly childId = input.required<string>();
  /** Versement dont la fiche est ouverte (`?payment=`). */
  readonly payment = input<string>();

  private readonly facade = inject(FinanceFacade);
  private readonly locale = inject(LOCALE_ID);
  private readonly paymentSheet = viewChild(PaymentSheetComponent);

  protected readonly documents = inject(FinanceDocumentsStore);
  protected readonly resource = this.facade.paymentsResource(() => ({ childId: this.childId() }));
  protected readonly data = latestValue(this.resource);

  protected readonly months = computed(() =>
    paymentMonths(this.data() ?? [], this.locale).map((month) => ({
      ...month,
      /** « 3 versements » : pas de total du mois, le front n'additionne pas (invariant 2). */
      count: countLabel(month.payments.length, 'versement', 'versements', ''),
      lines: month.payments.map((payment) => ({
        id: payment.paymentId,
        line: paymentLine(payment, this.locale),
      })),
    })),
  );
  protected readonly feesLink = computed(() => feesLink(this.childId()));

  protected readonly openPayment = computed(() =>
    this.data()?.find((payment) => payment.paymentId === this.payment()),
  );
  protected readonly fiche = injectQueryParamSheet('payment', {
    selected: this.openPayment,
    sheet: this.paymentSheet,
  });

  /** Le reçu scellé du versement ouvert ; null tant qu'il n'est pas émis. */
  protected readonly receiptHref = computed(() => {
    const payment = this.openPayment();
    return payment?.receiptNumber
      ? this.facade.receiptHref(this.childId(), payment.paymentId)
      : null;
  });
  private readonly openReceiptKey = computed(() => {
    const payment = this.openPayment();
    return payment ? receiptKey(payment.paymentId) : null;
  });
  protected readonly sharing = computed(() => this.documents.pending() === this.openReceiptKey());
  protected readonly failure = computed(() => {
    const failure = this.documents.failure();
    return failure?.key === this.openReceiptKey() ? failure.message : null;
  });

  protected share(payment: Payment): void {
    if (payment.receiptNumber) {
      void this.documents.shareReceipt(this.childId(), payment.paymentId, payment.receiptNumber);
    }
  }
}
