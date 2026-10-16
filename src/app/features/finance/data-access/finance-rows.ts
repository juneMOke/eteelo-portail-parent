import { Fee, FeeAllocation, Payment, PaymentAllocation } from '../../../core/api/finance.contract';
import { Money, amountLabel, spokenAmount } from '../../../shared/format/amount';
import { dayLabel, spokenDay } from '../../../shared/format/day-labels';
import { instantDay } from '../../../shared/format/time-labels';
import { IconName } from '../../../shared/ui/icon/icons';
import { Tone } from '../../../shared/ui/tone';
import {
  allocationsLabel,
  feeMoney,
  feeStatePill as feeStatusPill,
  feeStateView,
  methodView,
  paidShare,
  payerName,
  paymentTitle,
  spokenFee,
  spokenPayment,
} from './finance-formats';

/**
 * Une ligne des fiches de Mes finances (imputations de ⑤ et ⑧) : un fait par ligne, le
 * montant à droite, à la même place que dans les listes.
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

/**
 * Une ligne des listes de Mes frais (④) et Mes paiements (⑦), sur le modèle de la carte de
 * devoir (spec 07 v2 §3 bis) : pastille d'état à point, titre, détails, montant à droite en
 * Lora, chevron rond.
 */
export interface FinanceLine {
  /** Le mot de l'état et son ton ; null pour un état inconnu. */
  readonly status: { readonly label: string; readonly tone: Tone } | null;
  readonly heading: string;
  readonly details: readonly string[];
  readonly amounts: readonly Money[];
  /** Ton du montant ; null, Bleu Profond (un versement). */
  readonly amountTone: Tone | null;
  /** « sur 260 $ », sous le montant. */
  readonly amountNote: string | null;
  /** Liseré gauche au ton de l'état ; null pour un versement (les moyens n'ont pas de couleur). */
  readonly edge: Tone | null;
  /** Pastille d'icône neutre du moyen, au grand écran. */
  readonly icon: IconName | null;
  /** Part versée, de 0 à 1 : jauge de 5 px sous le nom d'un frais entamé. */
  readonly progress: number | null;
  readonly spoken: string;
}

/**
 * ④ Un frais : son état en pastille (« En retard depuis le 15/09 »), son nom, sa catégorie ; à
 * droite, ce qui reste « sur 260 $ », ou le montant réglé d'un frais payé.
 */
export function feeLine(fee: Fee, locale: string): FinanceLine {
  const state = feeStateView(fee.state);
  const paid = fee.state === 'PAID';
  const started = fee.paidInCents > 0 && fee.remainingInCents > 0;
  const alreadyPaid =
    fee.state === 'OVERDUE' && fee.paidInCents
      ? `${amountLabel(feeMoney(fee, fee.paidInCents), locale)} déjà versés`
      : null;
  return {
    status: state ? { label: feeStatusPill(fee, locale), tone: state.tone } : null,
    heading: fee.label,
    details: [fee.section?.title ?? null, alreadyPaid].filter((detail) => detail !== null),
    amounts: [feeMoney(fee, paid ? fee.expectedInCents : fee.remainingInCents)],
    amountTone: state?.tone ?? null,
    amountNote: paid ? null : `sur ${amountLabel(feeMoney(fee, fee.expectedInCents), locale)}`,
    edge: state?.tone ?? 'neutral',
    icon: null,
    progress: started ? paidShare(fee.paidInCents, fee.expectedInCents) : null,
    spoken: spokenFee(fee, locale),
  };
}

/** ⑦ Un versement : « Lundi 22/09 · Mobile money », ce qu'il couvre, son montant imputé. */
export function paymentLine(payment: Payment, locale: string): FinanceLine {
  return {
    status: { label: 'Enregistré', tone: 'success' },
    heading: paymentTitle(payment, locale),
    details: payment.allocations.length ? [allocationsLabel(payment)] : [],
    amounts: payment.amounts,
    amountTone: null,
    amountNote: null,
    edge: null,
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
