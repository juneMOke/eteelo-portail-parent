import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Payment } from '../../../core/api/finance.contract';
import { latestValue } from '../../../shared/resource/latest-value';
import { EmptyPeriodComponent } from '../../../shared/ui/empty-period/empty-period.component';
import { LoadErrorComponent } from '../../../shared/ui/load-error/load-error.component';
import { PillGroupComponent, PillOption } from '../../../shared/ui/pill-group/pill-group.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import {
  FinanceDocumentsStore,
  receiptKey,
  statementKey,
} from '../data-access/finance-documents.store';
import { feesLink } from '../data-access/finance-links';
import { FinanceFacade } from '../data-access/finance.facade';
import { ReceiptRowComponent } from '../ui/receipt-row/receipt-row.component';
import { StatementFooterComponent } from '../ui/statement-footer/statement-footer.component';

/**
 * Mes reçus : « la preuve ». Une archive de documents : un reçu par ligne (⑩), à ouvrir ou
 * partager en deux gestes, les années précédentes (⑨, `?year=`) et le relevé de l'année en
 * pied. Moyens, imputation et payeur restent dans Mes paiements.
 */
@Component({
  selector: 'app-receipts-page',
  imports: [
    EmptyPeriodComponent,
    LoadErrorComponent,
    PillGroupComponent,
    ReceiptRowComponent,
    SkeletonComponent,
    StatementFooterComponent,
  ],
  templateUrl: './receipts.page.html',
  styleUrl: '../finance-page.css',
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
  /** Le choix d'année, seulement s'il existe des années précédentes dans ETEELO. */
  protected readonly yearOptions = computed<readonly PillOption[]>(() => {
    const years = this.years() ?? [];
    return years.length > 1
      ? years.map((year) => ({ id: year.id, label: year.label, available: true, hint: null }))
      : [];
  });
  protected readonly checkedYear = computed(
    () => this.pastYear()?.id ?? this.years()?.find((year) => year.current)?.id,
  );

  /** Les versements dont le reçu est scellé : un document par ligne. */
  protected readonly receipts = computed(() =>
    (this.data() ?? []).filter((payment) => payment.receiptNumber),
  );
  protected readonly emptyHeading = computed(() => {
    if (this.data()?.length) return 'Les reçus de vos versements sont en préparation.';
    return this.pastYear()
      ? `Aucun versement enregistré en ${this.yearLabel()}.`
      : 'Aucun versement enregistré cette année.';
  });
  /** Depuis une année vide, le lien vers ce qui reste à payer, pour l'année courante seulement. */
  protected readonly feesLinkLabel = computed(() =>
    this.pastYear() || this.data()?.length ? null : 'Voir les frais à payer',
  );
  protected readonly feesLink = computed(() => feesLink(this.childId()));

  protected readonly statementOpening = computed(
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

  protected share(payment: Payment): void {
    if (payment.receiptNumber) {
      void this.documents.shareReceipt(this.childId(), payment.paymentId, payment.receiptNumber);
    }
  }

  protected openStatement(): void {
    void this.documents.openStatement(this.childId(), this.pastYear()?.id);
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
}
