import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { FeesTotal } from '../../../../core/api/finance.contract';
import { amountLabel } from '../../../../shared/format/amount';
import { asOfLabel, paidOverExpectedLabel, paidShare } from '../../data-access/finance-formats';

/**
 * ① Le bilan de l'année, seul endroit où figure le total : le reste domine, puis la jauge et
 * le versé sur le dû, une devise par bloc (jamais additionnées). Sous la jauge, la date de
 * situation : en finances, un chiffre sans date peut induire en erreur. Jauge sans animation.
 */
@Component({
  selector: 'app-balance-summary',
  templateUrl: './balance-summary.component.html',
  styleUrl: './balance-summary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BalanceSummaryComponent {
  /** « 2026-2027 ». */
  readonly yearLabel = input.required<string>();
  readonly totals = input.required<readonly FeesTotal[]>();
  readonly asOf = input.required<string>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly blocks = computed(() =>
    this.totals().map((total) => ({
      currency: total.currency,
      settled: total.remainingInCents === 0,
      remaining: amountLabel(
        { amountInCents: total.remainingInCents, currency: total.currency },
        this.locale,
      ),
      paid: paidOverExpectedLabel(total, this.locale),
      share: paidShare(total.paidInCents, total.expectedInCents),
    })),
  );
  protected readonly asOfText = computed(() => asOfLabel(this.asOf(), this.locale));
}
