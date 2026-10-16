import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Fee } from '../../../core/api/finance.contract';
import { injectQueryParamSheet } from '../../../shared/navigation/query-param-sheet';
import { latestValue } from '../../../shared/resource/latest-value';
import { EmptyPeriodComponent } from '../../../shared/ui/empty-period/empty-period.component';
import { LoadErrorComponent } from '../../../shared/ui/load-error/load-error.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { overdueHeadline } from '../data-access/finance-formats';
import { feeRow } from '../data-access/finance-rows';
import { FinanceFacade } from '../data-access/finance.facade';
import { BalanceSummaryComponent } from '../ui/balance-summary/balance-summary.component';
import { FeeSheetComponent } from '../ui/fee-sheet/fee-sheet.component';
import { HowToPaySheetComponent } from '../ui/how-to-pay-sheet/how-to-pay-sheet.component';
import { LedgerRowComponent } from '../ui/ledger-row/ledger-row.component';
import { OverdueBannerComponent } from '../ui/overdue-banner/overdue-banner.component';

/**
 * Mes frais : « combien, et quand ? ». Ce qui est en retard en haut (②), le bilan de l'année
 * (①), puis chaque frais dans l'ordre du serveur (④). La fiche d'un frais (⑤) vit dans l'URL
 * (`?fee=`) : un versement de Mes paiements y mène, et le retour la rouvre. « Comment payer »
 * (③) s'ouvre du bandeau ou de la fiche.
 */
@Component({
  selector: 'app-fees-page',
  imports: [
    BalanceSummaryComponent,
    EmptyPeriodComponent,
    FeeSheetComponent,
    HowToPaySheetComponent,
    LedgerRowComponent,
    LoadErrorComponent,
    OverdueBannerComponent,
    SkeletonComponent,
  ],
  templateUrl: './fees.page.html',
  styleUrl: '../finance-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FeesPage {
  readonly childId = input.required<string>();
  /** Frais dont la fiche est ouverte (`?fee=`). */
  readonly fee = input<string>();

  private readonly facade = inject(FinanceFacade);
  private readonly locale = inject(LOCALE_ID);
  private readonly feeSheet = viewChild(FeeSheetComponent);
  private readonly howToPaySheet = viewChild(HowToPaySheetComponent);

  protected readonly resource = this.facade.feesResource(this.childId);
  protected readonly data = latestValue(this.resource);
  protected readonly yearLabel = this.facade.currentYearLabel;
  protected readonly schoolPhone = this.facade.schoolPhone;

  protected readonly rows = computed(() =>
    (this.data()?.fees ?? []).map((fee) => ({ id: fee.feeId, row: feeRow(fee, this.locale) })),
  );
  protected readonly overdue = computed(() =>
    (this.data()?.fees ?? []).filter((fee) => fee.state === 'OVERDUE'),
  );
  protected readonly headline = computed(() => {
    const data = this.data();
    return data ? overdueHeadline(this.overdue(), data.totals, this.locale) : '';
  });

  protected readonly openFee = computed(() =>
    this.data()?.fees.find((fee) => fee.feeId === this.fee()),
  );
  protected readonly fiche = injectQueryParamSheet('fee', {
    selected: this.openFee,
    sheet: this.feeSheet,
  });
  /** Le frais que « Comment payer » rappelle ; null depuis le bandeau. */
  protected readonly payingFee = signal<Fee | null>(null);

  protected showHowToPay(fee: Fee | null): void {
    this.payingFee.set(fee);
    this.feeSheet()?.close();
    this.howToPaySheet()?.open();
  }
}
