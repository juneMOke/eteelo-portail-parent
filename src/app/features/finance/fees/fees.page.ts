import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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
import { SectionCardComponent } from '../../../shared/ui/section-card/section-card.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { overdueAmounts, overdueHeadline } from '../data-access/finance-formats';
import { feeLine } from '../data-access/finance-rows';
import { FinanceFacade } from '../data-access/finance.facade';
import { BalanceSummaryComponent } from '../ui/balance-summary/balance-summary.component';
import { FeeSheetComponent } from '../ui/fee-sheet/fee-sheet.component';
import { HowToPaySheetComponent } from '../ui/how-to-pay-sheet/how-to-pay-sheet.component';
import { FinanceLineComponent } from '../ui/finance-line/finance-line.component';
import { OverdueBannerComponent } from '../ui/overdue-banner/overdue-banner.component';

/**
 * Mes frais : « combien, et quand ? » (spec 07 « Mes frais · détail »). Le bilan de l'année (C),
 * l'alerte « À payer maintenant » si un frais est en retard (D), puis chaque frais dans l'ordre
 * du serveur, dans la carte « Les frais de l'année » (E). La fiche d'un frais (F) vit dans l'URL
 * (`?fee=`) : un versement de Mes paiements y mène, et le retour la rouvre. « Comment payer »
 * (G) s'ouvre de l'alerte ou de la fiche, et ramène à la fiche par sa flèche.
 */
import { StaleNoticeComponent } from '../../../shared/ui/stale-notice/stale-notice.component';
import { RefreshHighlightDirective } from '../../../shared/resource/refresh-highlight.directive';
@Component({
  selector: 'app-fees-page',
  imports: [
    BalanceSummaryComponent,
    EmptyPeriodComponent,
    FeeSheetComponent,
    FinanceLineComponent,
    HowToPaySheetComponent,
    LoadErrorComponent,
    OverdueBannerComponent,
    RefreshHighlightDirective,
    SectionCardComponent,
    SkeletonComponent,
    StaleNoticeComponent,
  ],
  templateUrl: './fees.page.html',
  styleUrls: ['../finance-page.css', './fees.page.css'],
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
  private readonly feeList = viewChild('feeList', { read: ElementRef });

  protected readonly resource = this.facade.feesResource(this.childId);
  protected readonly data = latestValue(this.resource);
  protected readonly yearLabel = this.facade.currentYearLabel;
  protected readonly schoolPhone = this.facade.schoolPhone;
  protected readonly childName = computed(() => this.facade.childName(this.childId()));

  protected readonly lines = computed(() =>
    (this.data()?.fees ?? []).map((fee) => ({ id: fee.feeId, line: feeLine(fee, this.locale) })),
  );
  protected readonly overdue = computed(() =>
    (this.data()?.fees ?? []).filter((fee) => fee.state === 'OVERDUE'),
  );
  /** « 4 frais ». */
  protected readonly feesCount = computed(() => `${this.data()?.fees.length ?? 0} frais`);
  /** « 1 en retard » ; null sans retard. */
  protected readonly overdueCount = computed(() => {
    const count = this.overdue().length;
    return count ? `${count} en retard` : null;
  });
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

  /** Le frais que « Comment payer » rappelle ; null pour plusieurs frais en retard. */
  protected readonly payingFee = signal<Fee | null>(null);
  /** Plusieurs frais en retard : leur reste par devise, tel que le serveur le donne. */
  protected readonly payingAmount = signal<string | null>(null);
  /** « Comment payer » ouvert depuis la fiche : sa flèche y ramène. */
  protected readonly payingFromFee = signal(false);

  /** Depuis l'alerte : le seul frais en retard, ou le retard de l'année par devise. */
  protected payOverdue(): void {
    const overdue = this.overdue();
    const totals = this.data()?.totals ?? [];
    this.openHowToPay(
      overdue.length === 1 ? overdue[0] : null,
      overdue.length === 1 ? null : overdueAmounts(totals, this.locale),
      false,
    );
  }

  protected payFee(fee: Fee): void {
    this.openHowToPay(fee, null, true);
  }

  protected backToFee(): void {
    const fee = this.payingFee();
    this.howToPaySheet()?.close();
    if (fee) this.fiche.show(fee.feeId);
  }

  protected showFeeList(): void {
    this.feeList()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private openHowToPay(fee: Fee | null, amount: string | null, fromFee: boolean): void {
    this.payingFee.set(fee);
    this.payingAmount.set(amount);
    this.payingFromFee.set(fromFee);
    this.feeSheet()?.close();
    this.howToPaySheet()?.open();
  }
}
