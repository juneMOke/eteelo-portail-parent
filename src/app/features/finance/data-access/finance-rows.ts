import { Fee, FeeAllocation, Payment, PaymentAllocation } from '../../../core/api/finance.contract';
import { Money, spokenAmount } from '../../../shared/format/amount';
import { dayLabel, spokenDay } from '../../../shared/format/day-labels';
import { instantDay } from '../../../shared/format/time-labels';
import { IconName } from '../../../shared/ui/icon/icons';
import { Tone } from '../../../shared/ui/tone';
import {
  feeStateView,
  feeStatusLine,
  methodView,
  paidShare,
  payerName,
  paymentMeta,
  paymentTitle,
  spokenFee,
  spokenPayment,
} from './finance-formats';

/**
 * Une ligne des listes de Mes finances (frais ④, versements ⑦, imputations des fiches ⑤ et
 * ⑧) : un fait par ligne, le montant à droite, à la même place sur les trois pages.
 */
export interface LedgerRow {
  readonly title: string;
  readonly detail: string | null;
  readonly amounts: readonly Money[];
  /** Filet à gauche, au ton de l'état ; null pour une ligne neutre (un versement). */
  readonly tone: Tone | null;
  /** Icône neutre du moyen de paiement. */
  readonly icon: IconName | null;
  /** Part versée, de 0 à 1, pour la jauge fine d'un frais partiellement payé. */
  readonly progress: number | null;
  /** Nom lu de la ligne entière. */
  readonly spoken: string;
}

/** ④ Un frais : nom, ligne d'état, montant dû. */
export function feeRow(fee: Fee, locale: string): LedgerRow {
  return {
    title: fee.label,
    detail: feeStatusLine(fee, locale),
    amounts: [{ amountInCents: fee.expectedInCents, currency: fee.currency }],
    tone: feeStateView(fee.state)?.tone ?? 'neutral',
    icon: null,
    progress: fee.state === 'PARTIAL' ? paidShare(fee.paidInCents, fee.expectedInCents) : null,
    spoken: spokenFee(fee, locale),
  };
}

/** ⑦ Un versement : jour et moyen, frais couverts et payeur, montant imputé. */
export function paymentRow(payment: Payment, locale: string): LedgerRow {
  return {
    title: paymentTitle(payment, locale),
    detail: paymentMeta(payment) || null,
    amounts: payment.amounts,
    tone: null,
    icon: methodView(payment.method).icon,
    progress: null,
    spoken: spokenPayment(payment, locale),
  };
}

/** ⑤ « Versements reçus » : un versement imputé au frais, qui ouvre sa fiche ⑧. */
export function feeAllocationRow(allocation: FeeAllocation, locale: string): LedgerRow {
  const day = instantDay(allocation.paidAt, locale);
  const payer = payerName(allocation);
  const money = { amountInCents: allocation.amountInCents, currency: allocation.currency };
  return {
    title: dayLabel(day, locale),
    detail: payer ? `Versé par ${payer}` : null,
    amounts: [money],
    tone: null,
    icon: null,
    progress: null,
    spoken: `Versement du ${spokenDay(day, locale).toLowerCase()}, ${spokenAmount(money, locale)}.`,
  };
}

/** ⑧ « Imputé sur » : un frais couvert par le versement, qui ouvre sa fiche ⑤. */
export function paymentAllocationRow(allocation: PaymentAllocation, locale: string): LedgerRow {
  const money = { amountInCents: allocation.amountInCents, currency: allocation.currency };
  return {
    title: allocation.label,
    detail: null,
    amounts: [money],
    tone: null,
    icon: null,
    progress: null,
    spoken: `${allocation.label}, ${spokenAmount(money, locale)} imputés.`,
  };
}
