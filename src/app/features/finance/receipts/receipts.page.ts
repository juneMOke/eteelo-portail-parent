import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  LOCALE_ID,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Payment } from '../../../core/api/finance.contract';
import { countLabel } from '../../../shared/format/count';
import { TABLET_SCREEN, mediaQuery } from '../../../shared/layout/media-query';
import { latestValue } from '../../../shared/resource/latest-value';
import { EmptyPeriodComponent } from '../../../shared/ui/empty-period/empty-period.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { LoadErrorComponent } from '../../../shared/ui/load-error/load-error.component';
import { SectionCardComponent } from '../../../shared/ui/section-card/section-card.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import {
  FinanceDocumentsStore,
  receiptKey,
  statementKey,
} from '../data-access/finance-documents.store';
import {
  latestReceiptLabel,
  receiptLabel,
  statementFileName,
} from '../data-access/finance-formats';
import { feesLink } from '../data-access/finance-links';
import { FinanceFacade } from '../data-access/finance.facade';
import { ReceiptRowComponent } from '../ui/receipt-row/receipt-row.component';
import { StatementFooterComponent } from '../ui/statement-footer/statement-footer.component';
import { YearBannerComponent, YearChoice } from '../ui/year-banner/year-banner.component';

/** Durée d'affichage de la confirmation d'un téléchargement. */
const SAVED_FOR_MS = 4_000;

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
    IconComponent,
    LoadErrorComponent,
    ReceiptRowComponent,
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly locale = inject(LOCALE_ID);

  protected readonly documents = inject(FinanceDocumentsStore);
  private readonly yearsResource = this.facade.academicYearsResource(this.childId);
  private readonly years = latestValue(this.yearsResource);

  /** L'année passée demandée par l'URL, si l'enfant y a été inscrit ; sinon l'année courante. */
  private readonly pastYear = computed(() =>
    this.years()?.find((year) => year.id === this.year() && !year.current),
  );
  /**
   * L'année à lire : celle de l'URL dès l'arrivée, sans attendre la liste des années (un seul
   * appel en 3G) ; une fois la liste lue, seulement si c'est une année passée de l'enfant.
   */
  private readonly requestedYear = computed(() =>
    this.years() ? this.pastYear()?.id : this.year(),
  );
  protected readonly resource = this.facade.paymentsResource(() => ({
    childId: this.childId(),
    academicYearId: this.requestedYear(),
  }));
  protected readonly data = latestValue(this.resource);

  protected readonly yearLabel = computed(
    () => this.pastYear()?.label ?? this.facade.currentYearLabel(),
  );
  /** Les années de l'enfant, la plus récente en tête. */
  protected readonly yearChoices = computed<readonly YearChoice[]>(() =>
    (this.years() ?? []).map((year) => ({ id: year.id, label: year.label })),
  );
  /** Pilules d'année dès la tablette ; menu déroulant au téléphone. */
  protected readonly wide = mediaQuery(TABLET_SCREEN);
  protected readonly checkedYear = computed(
    () => this.pastYear()?.id ?? this.years()?.find((year) => year.current)?.id,
  );

  /** Les versements de l'année, un reçu par ligne : scellé, ou en préparation. */
  protected readonly receipts = computed(() => this.data() ?? []);
  /** « 4 reçus ». */
  protected readonly receiptsCount = computed(() =>
    countLabel(this.receipts().length, 'reçu', 'reçus', 'Aucun reçu'),
  );
  /** « dernier le 22/09 ». */
  protected readonly latestReceipt = computed(() =>
    latestReceiptLabel(this.receipts(), this.locale),
  );
  /** « Reçus de l'année », « Reçus 2025-2026 ». */
  protected readonly receiptsHeading = computed(() =>
    this.pastYear() ? `Reçus ${this.yearLabel()}` : 'Reçus de l’année',
  );
  /** Le bandeau, dès qu'il y a des reçus ou d'autres années à consulter. */
  protected readonly showBanner = computed(
    () => this.receipts().length > 0 || this.yearChoices().length > 1,
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
  protected readonly saved = signal<string | null>(null);
  private savedTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly stopTimer = inject(DestroyRef).onDestroy(() => clearTimeout(this.savedTimer));

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
    if (outcome === 'downloaded') this.confirm(`${receiptLabel(number)} enregistré`);
  }

  protected async downloadStatement(): Promise<void> {
    const year = this.yearLabel();
    const done = await this.documents.downloadStatement(
      this.childId(),
      statementFileName(year),
      this.pastYear()?.id,
    );
    if (done) this.confirm(`Relevé de l’année ${year} enregistré`);
  }

  protected pickYear(id: string | null): void {
    const current = this.years()?.find((year) => year.id === id)?.current;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { year: current ? null : id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private confirm(message: string): void {
    clearTimeout(this.savedTimer);
    this.saved.set(message);
    this.savedTimer = setTimeout(() => this.saved.set(null), SAVED_FOR_MS);
  }
}
