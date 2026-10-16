/**
 * Contrat de Mes finances : routes P3 (DTO du back), enrichies par les lots F1 et F2 de
 * l'analyse back « Mes finances » v4, figée le 16/10/2026 (amendements B1 à B5 du front compris).
 *
 * À remplacer par les types générés (`npm run api:types`) dès que ces routes sont dans
 * l'OpenAPI de staging.
 */
import { Money } from '../../shared/format/amount';
import { CivilDate, Instant } from './assignments.contract';

/**
 * État d'un frais, calculé par le serveur au jour de l'école : OVERDUE (échéance passée et
 * reste > 0) prime sur PARTIAL. Une valeur inconnue s'affiche de façon neutre.
 */
export type FeeState = 'OVERDUE' | 'PARTIAL' | 'DUE' | 'PAID' | (string & {});

export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'MOBILE_MONEY' | (string & {});

/** Qui a versé, tel que la caisse l'a saisi. */
export interface Payer {
  readonly payerFirstName: string | null;
  readonly payerLastName: string | null;
  readonly payerMiddleName: string | null;
}

/** Totaux de l'année pour une devise ; un total ne mélange jamais USD et CDF. */
export interface FeesTotal {
  readonly currency: string;
  /** Réductions déduites. */
  readonly expectedInCents: number;
  readonly paidInCents: number;
  readonly remainingInCents: number;
  /** Reste des frais en retard de cette devise (B3). */
  readonly overdueInCents: number;
  readonly overdueCount: number;
}

/** Un versement imputé à un frais, vu depuis ce frais. */
export interface FeeAllocation extends Payer {
  readonly paymentId: string;
  readonly paidAt: Instant;
  /** Part du versement imputée au frais, dans la devise du frais. */
  readonly amountInCents: number;
  readonly currency: string;
  readonly receiptNumber: string | null;
}

/** Catégorie d'un frais, telle que nommée par l'école (« Frais scolaires »). */
export interface FeeSection {
  readonly code: string;
  readonly title: string;
}

/** Réduction appliquée à un frais ; `percent` de 0 à 100. */
export interface FeeReduction {
  readonly code: string;
  /** « Réduction fratrie ». */
  readonly label: string;
  readonly percent: number;
}

/** Un frais de l'année (créance de l'élève), montants dans sa devise. */
export interface Fee {
  readonly feeId: string;
  readonly feeCode: string;
  /** « Frais scolaires · 1re tranche ». */
  readonly label: string;
  readonly currency: string;
  /** Montant avant réduction. */
  readonly grossInCents: number;
  /** Montant dû, réduction déduite : c'est lui qui fait foi. */
  readonly expectedInCents: number;
  readonly paidInCents: number;
  readonly remainingInCents: number;
  readonly state: FeeState;
  /** Date civile de l'école ; null sans échéance. */
  readonly dueDate: CivilDate | null;
  /** Versement le plus récent imputé au frais (« Payé le 03/09 »). */
  readonly lastPaymentAt: Instant | null;
  readonly section: FeeSection | null;
  readonly reduction: FeeReduction | null;
  /** Le plus récent en tête. */
  readonly allocations: readonly FeeAllocation[];
}

/** `GET fees[?academicYearId]` : frais triés par état puis échéance. */
export interface ChildFees {
  /** Instant de la lecture : « Situation au 23/09 à 7 h 40 ». */
  readonly asOf: Instant;
  readonly totals: readonly FeesTotal[];
  readonly fees: readonly Fee[];
}

/** Ce qui a été perçu au guichet, dans une devise, au taux gelé ce jour-là. */
export interface ReceivedMoney extends Money {
  /** Unités de `currency` pour une unité de `pivotCurrency` ; 1 quand perçu = imputé. */
  readonly rate: number;
  readonly pivotCurrency: string;
}

/** Un frais couvert par un versement, vu depuis ce versement. */
export interface PaymentAllocation {
  readonly feeId: string;
  readonly feeCode: string;
  readonly label: string;
  readonly amountInCents: number;
  readonly currency: string;
}

/** Un versement enregistré par la caisse ; un versement annulé n'apparaît jamais. */
export interface Payment extends Payer {
  readonly paymentId: string;
  readonly paidAt: Instant;
  readonly method: PaymentMethod;
  /** Référence de l'opération (mobile money, banque), telle que saisie. */
  readonly externalReference: string | null;
  /** Imputé, une ligne par devise de frais couverte (B1). */
  readonly amounts: readonly Money[];
  /** Perçu au guichet, une ligne par devise tendue. */
  readonly received: readonly ReceivedMoney[];
  /** Null tant que le reçu n'est pas scellé : « Reçu en préparation ». */
  readonly receiptNumber: string | null;
  readonly allocations: readonly PaymentAllocation[];
}

/** Une année où l'enfant a été inscrit (`GET academic-years`), la plus récente en tête. */
export interface AcademicYear {
  readonly id: string;
  /** « 2026-2027 ». */
  readonly label: string;
  readonly startDate: CivilDate;
  readonly endDate: CivilDate;
  readonly current: boolean;
}
