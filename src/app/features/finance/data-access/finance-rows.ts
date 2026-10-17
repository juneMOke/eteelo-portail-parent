import { Fee, FeeAllocation, Payment, PaymentAllocation } from '../../../core/api/finance.contract';
import { Money, amountLabel, spokenAmount } from '../../../shared/format/amount';
import { dayLabel, spokenDay } from '../../../shared/format/day-labels';
import { instantDay } from '../../../shared/format/time-labels';
import { IconName } from '../../../shared/ui/icon/icons';
import { Tone } from '../../../shared/ui/tone';
import {
  allocationsLabel,
  feeCategoryIcon,
  feeMoney,
  feeStatePill as feeStatusPill,
  feeStateView,
  feeSubline,
  methodView,
  paidShare,
  payerName,
  paymentTitle,
  compactPaymentTitle,
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
  /** « Lun. 22/09 · Mobile money » : le titre au téléphone ; null, le même partout. */
  readonly compactHeading: string | null;
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
  /** « 180 $ déjà versés », à côté de la jauge au-delà du téléphone. */
  readonly progressNote: string | null;
  readonly spoken: string;
}

/**
 * E Un frais (spec 07 « Mes frais · détail ») : son état en pastille (« En retard depuis le
 * 15/09 »), son nom, « catégorie · échéance le 15/09 », la tuile de sa catégorie ; à droite, ce
 * qui reste « sur 260 $ », ou le montant « réglé » d'un frais payé. Un frais entamé (en retard ou
 * partiel) montre sa jauge et ce qui est déjà versé.
 */
export function feeLine(fee: Fee, locale: string): FinanceLine {
  const state = feeStateView(fee.state);
  const paid = fee.state === 'PAID';
  const started = fee.paidInCents > 0 && fee.remainingInCents > 0;
  const subline = feeSubline(fee, locale);
  return {
    status: state ? { label: feeStatusPill(fee, locale), tone: state.tone } : null,
    heading: fee.label,
    compactHeading: null,
    details: subline ? [subline] : [],
    amounts: [feeMoney(fee, paid ? fee.expectedInCents : fee.remainingInCents)],
    amountTone: state?.tone ?? null,
    amountNote: paid ? 'réglé' : `sur ${amountLabel(feeMoney(fee, fee.expectedInCents), locale)}`,
    edge: state?.tone ?? 'neutral',
    icon: feeCategoryIcon(fee),
    progress: started ? paidShare(fee.paidInCents, fee.expectedInCents) : null,
    progressNote: started
      ? `${amountLabel(feeMoney(fee, fee.paidInCents), locale)} déjà versés`
      : null,
    spoken: spokenFee(fee, locale),
  };
}

/** ⑦ Un versement : « Lundi 22/09 · Mobile money », ce qu'il couvre, son montant imputé. */
export function paymentLine(payment: Payment, locale: string): FinanceLine {
  return {
    status: { label: 'Enregistré', tone: 'success' },
    heading: paymentTitle(payment, locale),
    compactHeading: compactPaymentTitle(payment, locale),
    details: payment.allocations.length ? [allocationsLabel(payment)] : [],
    amounts: payment.amounts,
    amountTone: null,
    amountNote: null,
    edge: null,
    icon: methodView(payment.method).icon,
    progress: null,
    progressNote: null,
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
