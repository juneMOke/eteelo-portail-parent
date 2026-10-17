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
import { latestPaymentLabel, paymentMonths, receiptLabel } from '../data-access/finance-formats';
import { feesLink } from '../data-access/finance-links';
import { paymentLine } from '../data-access/finance-rows';
import { FinanceFacade } from '../data-access/finance.facade';
import { injectYearSelection } from '../data-access/year-selection';
import { FinanceLineComponent } from '../ui/finance-line/finance-line.component';
import { PaymentSheetComponent } from '../ui/payment-sheet/payment-sheet.component';
import { SavedToastComponent } from '../ui/saved-toast/saved-toast.component';
import { YearBannerComponent } from '../ui/year-banner/year-banner.component';

/**
 * Mes paiements : « c'est arrivé ? » (spec 07 « Mes paiements · détail »). Le journal des
 * versements de l'année : le bandeau d'année (C, `?year=`, le même que Mes reçus), puis une
 * carte par mois, le plus récent en haut (D). La fiche d'un versement (E) vit dans l'URL
 * (`?payment=`) : un frais de Mes frais y mène, et le retour la rouvre. Pas de bilan ni de
 * total ici : ils sont dans Mes frais, et le front n'additionne pas les versements.
 */
import { StaleNoticeComponent } from '../../../shared/ui/stale-notice/stale-notice.component';
import { RefreshHighlightDirective } from '../../../shared/resource/refresh-highlight.directive';
@Component({
  selector: 'app-payments-page',
  imports: [
    EmptyPeriodComponent,
    FinanceLineComponent,
    LoadErrorComponent,
    PaymentSheetComponent,
    RefreshHighlightDirective,
    SavedToastComponent,
    SectionCardComponent,
    SkeletonComponent,
    StaleNoticeComponent,
    YearBannerComponent,
  ],
  templateUrl: './payments.page.html',
  styleUrls: ['../finance-page.css', './payments.page.css'],
  providers: [FinanceDocumentsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PaymentsPage {
  readonly childId = input.required<string>();
  /** Année affichée (`?year=`) ; absente ou inconnue, l'année courante. */
  readonly year = input<string>();
  /** Versement dont la fiche est ouverte (`?payment=`). */
  readonly payment = input<string>();

  private readonly facade = inject(FinanceFacade);
  private readonly locale = inject(LOCALE_ID);
  private readonly paymentSheet = viewChild(PaymentSheetComponent);
  /** « Reçu n° ETL-RC-2627-001078 enregistré » : confirmation d'un reçu téléchargé. */
  private readonly saved = viewChild.required(SavedToastComponent);

  protected readonly documents = inject(FinanceDocumentsStore);
  protected readonly years = injectYearSelection(this.childId, this.year);
  protected readonly resource = this.facade.paymentsResource(() => ({
    childId: this.childId(),
    academicYearId: this.years.requested(),
  }));
  protected readonly data = latestValue(this.resource);

  protected readonly payments = computed(() => this.data() ?? []);
  /** « 5 versements ». */
  protected readonly paymentsCount = computed(() =>
    countLabel(this.payments().length, 'versement', 'versements', 'Aucun versement'),
  );
  /** « dernier le 22/09 ». */
  protected readonly latestPayment = computed(() =>
    latestPaymentLabel(this.payments(), this.locale),
  );
  /** Le bandeau, dès qu'il y a des versements ou d'autres années à consulter. */
  protected readonly showBanner = computed(
    () => this.payments().length > 0 || this.years.choices().length > 1,
  );

  protected readonly months = computed(() =>
    paymentMonths(this.payments(), this.locale).map((month) => ({
      ...month,
      /** « 3 versements » : pas de total du mois, le front n'additionne pas (invariant 2). */
      count: countLabel(month.payments.length, 'versement', 'versements', ''),
      lines: month.payments.map((payment) => ({
        id: payment.paymentId,
        line: paymentLine(payment, this.locale),
      })),
    })),
  );
  protected readonly emptyHeading = computed(() =>
    this.years.pastYear()
      ? `Aucun versement enregistré en ${this.years.label()}.`
      : 'Aucun versement enregistré cette année.',
  );
  /** Depuis une année vide, le lien vers ce qui reste à payer, pour l'année courante seulement. */
  protected readonly feesLinkLabel = computed(() =>
    this.years.pastYear() ? null : 'Voir les frais à payer ›',
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

  protected async share(payment: Payment): Promise<void> {
    const number = payment.receiptNumber;
    if (!number) return;
    const outcome = await this.documents.shareReceipt(this.childId(), payment.paymentId, number);
    if (outcome === 'downloaded') this.saved().show(`${receiptLabel(number)} enregistré`);
  }
}
