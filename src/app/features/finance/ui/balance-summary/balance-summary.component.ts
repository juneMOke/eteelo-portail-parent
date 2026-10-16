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
 * ① Le bilan de l'année, seul endroit où figure le total : bandeau kuba « Année 2026-2027 » et
 * sa date de situation (en finances, un chiffre sans date peut induire en erreur), puis le reste
 * qui domine, la jauge, le versé sur le dû et deux cases Total · Versé ; une devise par bloc,
 * jamais additionnées. La jauge glisse quand l'enfant change, jamais depuis zéro à l'ouverture.
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
      paidOverExpected: paidOverExpectedLabel(total, this.locale),
      expected: amountLabel(
        { amountInCents: total.expectedInCents, currency: total.currency },
        this.locale,
      ),
      paid: amountLabel({ amountInCents: total.paidInCents, currency: total.currency }, this.locale),
      share: paidShare(total.paidInCents, total.expectedInCents),
    })),
  );
  protected readonly asOfText = computed(() => asOfLabel(this.asOf(), this.locale));
}
