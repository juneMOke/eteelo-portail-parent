import { formatNumber } from '@angular/common';
import {
  Fee,
  FeeReduction,
  FeeState,
  FeesTotal,
  Payer,
  Payment,
  PaymentMethod,
  ReceivedMoney,
} from '../../../core/api/finance.contract';
import { CivilMonth, monthOf } from '../../../shared/date/civil-date';
import { Money, amountLabel, currencySymbol, spokenAmount } from '../../../shared/format/amount';
import { dayLabel, monthLabel, shortDate, spokenDay } from '../../../shared/format/day-labels';
import { instantDay, instantTime } from '../../../shared/format/time-labels';
import { IconName } from '../../../shared/ui/icon/icons';
import { Tone } from '../../../shared/ui/tone';

/**
 * Mise en forme de Mes finances (spec 07 §4 et §6). États, restes, totaux et ordres viennent du
 * serveur : on les écrit, on ne les recalcule pas. Pas de rouge, pas de « défaut » : un retard
 * se dit avec sa date et ce qui reste.
 */

export interface FeeStateView {
  readonly label: string;
  readonly tone: Tone;
}

const FEE_STATES: Readonly<Record<string, FeeStateView>> = {
  OVERDUE: { label: 'En retard', tone: 'alert' },
  PARTIAL: { label: 'Partiellement payé', tone: 'pending' },
  DUE: { label: 'À payer', tone: 'info' },
  PAID: { label: 'Payé', tone: 'success' },
};

/** Mot et ton d'un état ; un état inconnu reste neutre, sans mot inventé. */
export function feeStateView(state: FeeState): FeeStateView | null {
  return FEE_STATES[state] ?? null;
}

/** Un montant d'un frais, dans la devise du frais. */
export function feeMoney(fee: Fee, amountInCents: number): Money {
  return { amountInCents, currency: fee.currency };
}

/**
 * La ligne d'état d'un frais, toujours avec ce qui reste : « En retard depuis le 15/09 ·
 * 80 $ restant · 180 $ déjà versés », « 80 $ restant avant le 30/09 », « 234 $ avant le
 * 15/12 », « Payé le 03/09 ».
 */
export function feeStatusLine(fee: Fee, locale: string): string {
  const remaining = amountLabel(feeMoney(fee, fee.remainingInCents), locale);
  const due = fee.dueDate ? shortDate(fee.dueDate, locale) : null;
  switch (fee.state) {
    case 'OVERDUE': {
      const paid = fee.paidInCents
        ? ` · ${amountLabel(feeMoney(fee, fee.paidInCents), locale)} déjà versés`
        : '';
      const since = due ? `En retard depuis le ${due}` : 'En retard';
      return `${since} · ${remaining} restant${paid}`;
    }
    case 'PARTIAL':
      return due ? `${remaining} restant avant le ${due}` : `${remaining} restant`;
    case 'DUE':
      return due ? `${remaining} avant le ${due}` : `${remaining} à payer`;
    case 'PAID':
      return fee.lastPaymentAt
        ? `Payé le ${shortDate(instantDay(fee.lastPaymentAt, locale), locale)}`
        : 'Payé';
    default:
      return `${remaining} restant`;
  }
}

/** Nom lu d'une ligne de frais : « Frais scolaires, 1re tranche, 260 dollars, en retard… ». */
export function spokenFee(fee: Fee, locale: string): string {
  const name = fee.label.replaceAll(' · ', ', ');
  const amount = spokenAmount(feeMoney(fee, fee.expectedInCents), locale);
  const remaining = `${spokenAmount(feeMoney(fee, fee.remainingInCents), locale)} restant`;
  const due = fee.dueDate ? spokenDay(fee.dueDate, locale).toLowerCase() : null;
  const state = {
    OVERDUE: due ? `en retard depuis le ${due}, ${remaining}` : `en retard, ${remaining}`,
    PARTIAL: due ? `${remaining} avant le ${due}` : remaining,
    DUE: due ? `à payer avant le ${due}` : 'à payer',
    PAID: 'payé',
  }[fee.state as string];
  return `${name}, ${amount}${state ? `, ${state}` : ''}.`;
}

/** « Réduction fratrie 10 % » : le pourcentage tel que l'école l'a posé, sans soustraction. */
export function reductionLabel(reduction: FeeReduction, locale: string): string {
  return `${reduction.label} ${formatNumber(reduction.percent, locale, '1.0-2')}\u00a0%`;
}

/** « 280 $ versés sur 594 $ ». */
export function paidOverExpectedLabel(total: FeesTotal, locale: string): string {
  const paid = amountLabel({ amountInCents: total.paidInCents, currency: total.currency }, locale);
  const expected = amountLabel(
    { amountInCents: total.expectedInCents, currency: total.currency },
    locale,
  );
  return `${paid} versés sur ${expected}`;
}

/**
 * Part versée, de 0 à 1 : la largeur d'une jauge, pas un montant. Elle se lit sur les chiffres
 * du serveur, jamais affichée en pourcentage.
 */
export function paidShare(paidInCents: number, expectedInCents: number): number {
  return expectedInCents > 0 ? Math.min(paidInCents / expectedInCents, 1) : 1;
}

/** « Situation au 23/09 à 7 h 40 » : en finances, un chiffre sans date peut induire en erreur. */
export function asOfLabel(asOf: string, locale: string): string {
  return `Situation au ${shortDate(instantDay(asOf, locale), locale)} à ${instantTime(asOf, locale)}`;
}

/**
 * Le bandeau « À payer maintenant » : un frais en retard est nommé (« 1re tranche · 80 $ en
 * retard depuis le 15/09 ») ; plusieurs sont comptés, avec leur reste par devise tel que le
 * serveur le donne (« 2 frais · 220 $ en retard »).
 */
export function overdueHeadline(
  overdue: readonly Fee[],
  totals: readonly FeesTotal[],
  locale: string,
): string {
  if (overdue.length === 1) {
    const [fee] = overdue;
    const remaining = amountLabel(feeMoney(fee, fee.remainingInCents), locale);
    const since = fee.dueDate ? ` depuis le ${shortDate(fee.dueDate, locale)}` : '';
    return `${fee.label} · ${remaining} en retard${since}`;
  }
  const amounts = totals
    .filter((total) => total.overdueCount > 0)
    .map((total) =>
      amountLabel({ amountInCents: total.overdueInCents, currency: total.currency }, locale),
    )
    .join(' · ');
  return `${overdue.length} frais · ${amounts} en retard`;
}

/** « Léonie Kabila » ; null si la caisse n'a pas saisi de nom. */
export function payerName(payer: Payer): string | null {
  const name = [payer.payerFirstName, payer.payerLastName].filter(Boolean).join(' ');
  return name || null;
}

interface MethodView {
  readonly label: string;
  readonly icon: IconName;
}

const METHODS: Readonly<Record<string, MethodView>> = {
  CASH: { label: 'Espèces', icon: 'wallet' },
  MOBILE_MONEY: { label: 'Mobile money', icon: 'smartphone' },
  CREDIT_CARD: { label: 'Carte bancaire', icon: 'credit-card' },
  DEBIT_CARD: { label: 'Carte bancaire', icon: 'credit-card' },
};

/** Le moyen de paiement, en mot et en icône neutre : jamais de couleur par moyen. */
export function methodView(method: PaymentMethod): MethodView {
  return METHODS[method] ?? { label: 'Autre moyen', icon: 'dollar' };
}

/** « Lundi 22/09 · Mobile money ». */
export function paymentTitle(payment: Payment, locale: string): string {
  return `${dayLabel(instantDay(payment.paidAt, locale), locale)} · ${methodView(payment.method).label}`;
}

/** « Frais scolaires · 1re tranche · Léonie Kabila », « 2 frais · Joseph Mbala ». */
export function paymentMeta(payment: Payment): string {
  const { allocations } = payment;
  const fees = allocations.length === 1 ? allocations[0].label : `${allocations.length} frais`;
  return [allocations.length ? fees : null, payerName(payment)].filter(Boolean).join(' · ');
}

/** « Lundi 22 septembre à 11 h 05 » : le moment du versement, sur sa fiche. */
export function paidAtLabel(payment: Payment, locale: string): string {
  const day = spokenDay(instantDay(payment.paidAt, locale), locale);
  return `${day} à ${instantTime(payment.paidAt, locale)}`;
}

/** Nom lu d'une ligne de versement : « Lundi 22 septembre, mobile money, 40 dollars. » */
export function spokenPayment(payment: Payment, locale: string): string {
  const day = spokenDay(instantDay(payment.paidAt, locale), locale);
  const amounts = payment.amounts.map((money) => spokenAmount(money, locale)).join(' et ');
  return `${day}, ${methodView(payment.method).label.toLowerCase()}, ${amounts}.`;
}

/**
 * Ce qui a été perçu au guichet, quand ce n'est pas ce qui a été imputé : « 280 000 FC au taux
 * de 2 800 FC pour 1 $ ». Le taux est celui gelé ce jour-là, recopié tel quel. Null quand
 * perçu et imputé sont la même chose.
 */
export function receivedLabel(received: readonly ReceivedMoney[], locale: string): string | null {
  if (received.every((money) => money.rate === 1)) return null;
  return received
    .map((money) => {
      const amount = amountLabel(money, locale);
      if (money.rate === 1) return amount;
      const rate = `${formatNumber(money.rate, locale, '1.0-6')}\u202f${currencySymbol(money.currency)}`;
      const unit = amountLabel({ amountInCents: 100, currency: money.pivotCurrency }, locale);
      return `${amount} au taux de ${rate} pour ${unit}`;
    })
    .join(' · ');
}

/** « Reçu n° ETL-RC-2627-001078 ». */
export function receiptLabel(receiptNumber: string): string {
  return `Reçu n° ${receiptNumber}`;
}

/** Nom du fichier d'un reçu partagé : son numéro. */
export function receiptFileName(receiptNumber: string): string {
  return `${receiptNumber}.pdf`;
}

/** « 22/09 · 40 $ » : la date et le montant d'un reçu, sur sa ligne. */
export function receiptMeta(payment: Payment, locale: string): string {
  const day = shortDate(instantDay(payment.paidAt, locale), locale);
  return `${day} · ${payment.amounts.map((money) => amountLabel(money, locale)).join(' · ')}`;
}

export interface PaymentMonth {
  readonly month: CivilMonth;
  /** « Septembre 2026 ». */
  readonly label: string;
  readonly payments: readonly Payment[];
}

/**
 * Le journal par mois, le plus récent en haut, dans l'ordre du serveur. Pas de total par mois :
 * le front n'additionne pas les versements (invariant 2).
 */
export function paymentMonths(payments: readonly Payment[], locale: string): PaymentMonth[] {
  const months: { month: CivilMonth; label: string; payments: Payment[] }[] = [];
  for (const payment of payments) {
    const month = monthOf(instantDay(payment.paidAt, locale));
    const last = months.at(-1);
    if (last?.month === month) last.payments.push(payment);
    else months.push({ month, label: monthLabel(month, locale), payments: [payment] });
  }
  return months;
}
