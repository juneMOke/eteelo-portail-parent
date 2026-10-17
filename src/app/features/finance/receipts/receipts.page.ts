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
import { latestValue } from '../../../shared/resource/latest-value';
import { EmptyPeriodComponent } from '../../../shared/ui/empty-period/empty-period.component';
import { LoadErrorComponent } from '../../../shared/ui/load-error/load-error.component';
import { SectionCardComponent } from '../../../shared/ui/section-card/section-card.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import {
  FinanceDocumentsStore,
  receiptKey,
  statementKey,
} from '../data-access/finance-documents.store';
import {
  latestPaymentLabel,
  receiptLabel,
  statementFileName,
} from '../data-access/finance-formats';
import { feesLink } from '../data-access/finance-links';
import { FinanceFacade } from '../data-access/finance.facade';
import { injectYearSelection } from '../data-access/year-selection';
import { SavedToastComponent } from '../ui/saved-toast/saved-toast.component';
import { ReceiptRowComponent } from '../ui/receipt-row/receipt-row.component';
import { StatementFooterComponent } from '../ui/statement-footer/statement-footer.component';
import { YearBannerComponent } from '../ui/year-banner/year-banner.component';

/**
 * Mes reçus : « la preuve » (spec 07 « Mes reçus · détail »). Une archive de documents : le
 * bandeau d'année (C, `?year=`, pilules au-delà du téléphone, menu déroulant au téléphone), un
 * reçu par ligne dans la carte « Reçus de l'année » (D), à ouvrir ou partager en deux gestes, et
 * le relevé de l'année à télécharger (E). Un téléchargement est confirmé en bas d'écran (H1).
 * Imputation détaillée et payeur restent dans Mes paiements.
 */
@Component({
  selector: 'app-receipts-page',
  imports: [
    EmptyPeriodComponent,
    LoadErrorComponent,
    ReceiptRowComponent,
    SavedToastComponent,
    SectionCardComponent,
    SkeletonComponent,
    StatementFooterComponent,
    YearBannerComponent,
  ],
  templateUrl: './receipts.page.html',
  styleUrls: ['../finance-page.css', './receipts.page.css'],
  providers: [FinanceDocumentsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ReceiptsPage {
  readonly childId = input.required<string>();
  /** Année affichée (`?year=`) ; absente ou inconnue, l'année courante. */
  readonly year = input<string>();

  private readonly facade = inject(FinanceFacade);
  private readonly locale = inject(LOCALE_ID);

  protected readonly documents = inject(FinanceDocumentsStore);
  protected readonly years = injectYearSelection(this.childId, this.year);
  private readonly pastYear = this.years.pastYear;
  protected readonly yearLabel = this.years.label;
  protected readonly resource = this.facade.paymentsResource(() => ({
    childId: this.childId(),
    academicYearId: this.years.requested(),
  }));
  protected readonly data = latestValue(this.resource);

  /** Les versements de l'année, un reçu par ligne : scellé, ou en préparation. */
  protected readonly receipts = computed(() => this.data() ?? []);
  /** « 4 reçus ». */
  protected readonly receiptsCount = computed(() =>
    countLabel(this.receipts().length, 'reçu', 'reçus', 'Aucun reçu'),
  );
  /** « dernier le 22/09 ». */
  protected readonly latestReceipt = computed(() =>
    latestPaymentLabel(this.receipts(), this.locale),
  );
  /** « Reçus de l'année », « Reçus 2025-2026 ». */
  protected readonly receiptsHeading = computed(() =>
    this.pastYear() ? `Reçus ${this.yearLabel()}` : 'Reçus de l’année',
  );
  /** Le bandeau, dès qu'il y a des reçus ou d'autres années à consulter. */
  protected readonly showBanner = computed(
    () => this.receipts().length > 0 || this.years.choices().length > 1,
  );
  protected readonly emptyHeading = computed(() =>
    this.pastYear()
      ? `Aucun versement enregistré en ${this.yearLabel()}.`
      : 'Aucun versement enregistré cette année.',
  );
  /** Depuis une année vide, le lien vers ce qui reste à payer, pour l'année courante seulement. */
  protected readonly feesLinkLabel = computed(() =>
    this.pastYear() ? null : 'Voir les frais à payer ›',
  );
  protected readonly feesLink = computed(() => feesLink(this.childId()));

  /** « Reçu n° ETL-RC-2627-001078 enregistré » : confirmation d'un téléchargement (H1). */
  private readonly saved = viewChild.required(SavedToastComponent);

  protected readonly statementLoading = computed(
    () => this.documents.pending() === statementKey(this.pastYear()?.id),
  );
  protected readonly statementFailure = computed(() => {
    const failure = this.documents.failure();
    return failure?.key === statementKey(this.pastYear()?.id) ? failure.message : null;
  });

  protected receiptHref(payment: Payment): string {
    return this.facade.receiptHref(this.childId(), payment.paymentId);
  }

  protected isSharing(payment: Payment): boolean {
    return this.documents.pending() === receiptKey(payment.paymentId);
  }

  protected receiptFailure(payment: Payment): string | null {
    const failure = this.documents.failure();
    return failure?.key === receiptKey(payment.paymentId) ? failure.message : null;
  }

  protected async share(payment: Payment): Promise<void> {
    const number = payment.receiptNumber;
    if (!number) return;
    const outcome = await this.documents.shareReceipt(this.childId(), payment.paymentId, number);
    if (outcome === 'downloaded') this.saved().show(`${receiptLabel(number)} enregistré`);
  }

  protected async downloadStatement(): Promise<void> {
    const year = this.yearLabel();
    const done = await this.documents.downloadStatement(
      this.childId(),
      statementFileName(year),
      this.pastYear()?.id,
    );
    if (done) this.saved().show(`Relevé de l’année ${year} enregistré`);
  }
}
