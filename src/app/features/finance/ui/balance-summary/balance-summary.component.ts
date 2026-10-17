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
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { asOfLabel, paidShare } from '../../data-access/finance-formats';

/**
 * C Le bilan de l'année, seul endroit où figure le total. Tête Bleu Ardoise à motif kuba : la
 * date de situation (en finances, un chiffre sans date peut induire en erreur), « Année scolaire
 * 2026-2027 » et le nombre de frais. Corps bleu brume : le reste qui domine (jamais en terre
 * cuite, le retard se lit dans l'alerte), la jauge, le versé sur le total, et les cases Total ·
 * Déjà versé. Une devise par bloc, jamais additionnées. La jauge glisse quand l'enfant change,
 * jamais depuis zéro à l'ouverture.
 */
@Component({
  selector: 'app-balance-summary',
  imports: [IconComponent],
  templateUrl: './balance-summary.component.html',
  styleUrl: './balance-summary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BalanceSummaryComponent {
  /** « 2026-2027 ». */
  readonly yearLabel = input.required<string>();
  readonly totals = input.required<readonly FeesTotal[]>();
  readonly asOf = input.required<string>();
  /** « 4 frais ». */
  readonly count = input.required<string>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly blocks = computed(() =>
    this.totals().map((total) => {
      const money = (amountInCents: number) =>
        amountLabel({ amountInCents, currency: total.currency }, this.locale);
      return {
        currency: total.currency,
        settled: total.remainingInCents === 0,
        remaining: money(total.remainingInCents),
        expected: money(total.expectedInCents),
        paid: money(total.paidInCents),
        share: paidShare(total.paidInCents, total.expectedInCents),
      };
    }),
  );
  protected readonly asOfText = computed(() => asOfLabel(this.asOf(), this.locale));
}
