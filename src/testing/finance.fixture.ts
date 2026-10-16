import type {
  AcademicYear,
  ChildFees,
  Fee,
  FeeAllocation,
  Payment,
} from '../app/core/api/finance.contract';
import { bootstrapFixture } from './bootstrap.fixture';

/**
 * Mes finances de Grâce (contrat F1/F2), situation au mardi 23 septembre 2026 : quatre frais
 * dans les quatre états, en dollars et en francs, et quatre versements, dont un frais en
 * dollars payé en francs et un reçu pas encore émis. L'année 2025-2026 n'a que deux versements.
 * Partagées par les tests unitaires, le serveur factice et les parcours Playwright.
 */
export const YEAR = {
  current: bootstrapFixture().academicYear.id,
  past: 'b1000000-0000-4000-8000-000000000001',
} as const;

export const ACADEMIC_YEARS: readonly AcademicYear[] = [
  {
    id: YEAR.current,
    label: '2026-2027',
    startDate: '2026-09-01',
    endDate: '2027-07-02',
    current: true,
  },
  {
    id: YEAR.past,
    label: '2025-2026',
    startDate: '2025-09-01',
    endDate: '2026-07-03',
    current: false,
  },
];

export const FEE_ID = {
  firstInstalment: 'f1000000-0000-4000-8000-000000000001',
  transport: 'f1000000-0000-4000-8000-000000000002',
  secondInstalment: 'f1000000-0000-4000-8000-000000000003',
  registration: 'f1000000-0000-4000-8000-000000000004',
} as const;

export const PAYMENT_ID = {
  airtel: 'e1000000-0000-4000-8000-000000000004',
  transport: 'e1000000-0000-4000-8000-000000000003',
  cash: 'e1000000-0000-4000-8000-000000000002',
  registration: 'e1000000-0000-4000-8000-000000000001',
  pastFirst: 'e0000000-0000-4000-8000-000000000001',
  pastSecond: 'e0000000-0000-4000-8000-000000000002',
} as const;

const MOTHER = { payerFirstName: 'Léonie', payerLastName: 'Kabila', payerMiddleName: 'Mwamba' };
const FATHER = { payerFirstName: 'Joseph', payerLastName: 'Mbala', payerMiddleName: null };

const SCHOOL_FEES = { code: 'SCOLARITE', title: 'Frais scolaires' };

function allocation(payment: Payment, feeId: string): FeeAllocation {
  const share = payment.allocations.find((item) => item.feeId === feeId);
  return {
    paymentId: payment.paymentId,
    paidAt: payment.paidAt,
    amountInCents: share?.amountInCents ?? 0,
    currency: share?.currency ?? '',
    receiptNumber: payment.receiptNumber,
    payerFirstName: payment.payerFirstName,
    payerLastName: payment.payerLastName,
    payerMiddleName: payment.payerMiddleName,
  };
}

/** Versé hier par Airtel Money : reçu pas encore scellé. */
export const AIRTEL_PAYMENT: Payment = {
  paymentId: PAYMENT_ID.airtel,
  paidAt: '2026-09-22T10:05:00Z',
  method: 'MOBILE_MONEY',
  externalReference: 'MP260922.1105.A41',
  amounts: [{ amountInCents: 4000, currency: 'USD' }],
  received: [{ amountInCents: 4000, currency: 'USD', rate: 1, pivotCurrency: 'USD' }],
  receiptNumber: null,
  ...MOTHER,
  allocations: [
    {
      feeId: FEE_ID.firstInstalment,
      feeCode: 'TUITION',
      label: 'Frais scolaires · 1re tranche',
      amountInCents: 4000,
      currency: 'USD',
    },
  ],
};

export const TRANSPORT_PAYMENT: Payment = {
  paymentId: PAYMENT_ID.transport,
  paidAt: '2026-09-12T09:30:00Z',
  method: 'CASH',
  externalReference: null,
  amounts: [{ amountInCents: 5_000_000, currency: 'CDF' }],
  received: [{ amountInCents: 5_000_000, currency: 'CDF', rate: 1, pivotCurrency: 'CDF' }],
  receiptNumber: 'ETL-RC-2627-001061',
  ...FATHER,
  allocations: [
    {
      feeId: FEE_ID.transport,
      feeCode: 'TRANSPORT',
      label: 'Transport scolaire · 1er trimestre',
      amountInCents: 5_000_000,
      currency: 'CDF',
    },
  ],
};

export const CASH_PAYMENT: Payment = {
  paymentId: PAYMENT_ID.cash,
  paidAt: '2026-09-05T08:15:00Z',
  method: 'CASH',
  externalReference: null,
  amounts: [{ amountInCents: 14_000, currency: 'USD' }],
  received: [{ amountInCents: 14_000, currency: 'USD', rate: 1, pivotCurrency: 'USD' }],
  receiptNumber: 'ETL-RC-2627-001042',
  ...MOTHER,
  allocations: [
    {
      feeId: FEE_ID.firstInstalment,
      feeCode: 'TUITION',
      label: 'Frais scolaires · 1re tranche',
      amountInCents: 14_000,
      currency: 'USD',
    },
  ],
};

/** Un frais en dollars payé en francs, au taux du guichet ce jour-là. */
export const REGISTRATION_PAYMENT: Payment = {
  paymentId: PAYMENT_ID.registration,
  paidAt: '2026-09-03T08:00:00Z',
  method: 'CASH',
  externalReference: null,
  amounts: [{ amountInCents: 10_000, currency: 'USD' }],
  received: [{ amountInCents: 28_000_000, currency: 'CDF', rate: 2800, pivotCurrency: 'USD' }],
  receiptNumber: 'ETL-RC-2627-001031',
  ...MOTHER,
  allocations: [
    {
      feeId: FEE_ID.registration,
      feeCode: 'REGISTRATION',
      label: 'Frais d’inscription',
      amountInCents: 10_000,
      currency: 'USD',
    },
  ],
};

const PAYMENTS: readonly Payment[] = [
  AIRTEL_PAYMENT,
  TRANSPORT_PAYMENT,
  CASH_PAYMENT,
  REGISTRATION_PAYMENT,
];

const PAST_PAYMENTS: readonly Payment[] = [
  {
    ...CASH_PAYMENT,
    paymentId: PAYMENT_ID.pastSecond,
    paidAt: '2026-01-12T09:00:00Z',
    receiptNumber: 'ETL-RC-2526-000912',
    amounts: [{ amountInCents: 24_000, currency: 'USD' }],
    received: [{ amountInCents: 24_000, currency: 'USD', rate: 1, pivotCurrency: 'USD' }],
    allocations: [],
  },
  {
    ...CASH_PAYMENT,
    paymentId: PAYMENT_ID.pastFirst,
    paidAt: '2025-09-04T09:00:00Z',
    receiptNumber: 'ETL-RC-2526-000415',
    amounts: [{ amountInCents: 26_000, currency: 'USD' }],
    received: [{ amountInCents: 26_000, currency: 'USD', rate: 1, pivotCurrency: 'USD' }],
    allocations: [],
  },
];

export const OVERDUE_FEE: Fee = {
  feeId: FEE_ID.firstInstalment,
  feeCode: 'TUITION',
  label: 'Frais scolaires · 1re tranche',
  currency: 'USD',
  grossInCents: 26_000,
  expectedInCents: 26_000,
  paidInCents: 18_000,
  remainingInCents: 8000,
  state: 'OVERDUE',
  dueDate: '2026-09-15',
  lastPaymentAt: AIRTEL_PAYMENT.paidAt,
  section: SCHOOL_FEES,
  reduction: null,
  allocations: [
    allocation(AIRTEL_PAYMENT, FEE_ID.firstInstalment),
    allocation(CASH_PAYMENT, FEE_ID.firstInstalment),
  ],
};

export const PARTIAL_FEE: Fee = {
  feeId: FEE_ID.transport,
  feeCode: 'TRANSPORT',
  label: 'Transport scolaire · 1er trimestre',
  currency: 'CDF',
  grossInCents: 15_000_000,
  expectedInCents: 15_000_000,
  paidInCents: 5_000_000,
  remainingInCents: 10_000_000,
  state: 'PARTIAL',
  dueDate: '2026-10-10',
  lastPaymentAt: TRANSPORT_PAYMENT.paidAt,
  section: { code: 'TRANSPORT', title: 'Transport' },
  reduction: null,
  allocations: [allocation(TRANSPORT_PAYMENT, FEE_ID.transport)],
};

/** Réduction fratrie : 260 $ bruts, 234 $ dus. */
export const DUE_FEE: Fee = {
  feeId: FEE_ID.secondInstalment,
  feeCode: 'TUITION',
  label: 'Frais scolaires · 2e tranche',
  currency: 'USD',
  grossInCents: 26_000,
  expectedInCents: 23_400,
  paidInCents: 0,
  remainingInCents: 23_400,
  state: 'DUE',
  dueDate: '2026-12-15',
  lastPaymentAt: null,
  section: SCHOOL_FEES,
  reduction: { code: 'FRATRIE', label: 'Réduction fratrie', percent: 10 },
  allocations: [],
};

export const PAID_FEE: Fee = {
  feeId: FEE_ID.registration,
  feeCode: 'REGISTRATION',
  label: 'Frais d’inscription',
  currency: 'USD',
  grossInCents: 10_000,
  expectedInCents: 10_000,
  paidInCents: 10_000,
  remainingInCents: 0,
  state: 'PAID',
  dueDate: '2026-09-05',
  lastPaymentAt: REGISTRATION_PAYMENT.paidAt,
  section: null,
  reduction: null,
  allocations: [allocation(REGISTRATION_PAYMENT, FEE_ID.registration)],
};

/** `GET fees` : frais dans l'ordre du serveur (en retard, échéance la plus proche, payés). */
export function feesFixture(): ChildFees {
  return {
    asOf: '2026-09-23T06:40:00Z',
    totals: [
      {
        currency: 'USD',
        expectedInCents: 59_400,
        paidInCents: 28_000,
        remainingInCents: 31_400,
        overdueInCents: 8000,
        overdueCount: 1,
      },
      {
        currency: 'CDF',
        expectedInCents: 15_000_000,
        paidInCents: 5_000_000,
        remainingInCents: 10_000_000,
        overdueInCents: 0,
        overdueCount: 0,
      },
    ],
    fees: [OVERDUE_FEE, PARTIAL_FEE, DUE_FEE, PAID_FEE],
  };
}

/** Frais pas encore publiés par l'école. */
export function unpublishedFeesFixture(): ChildFees {
  return { asOf: '2026-09-02T06:40:00Z', totals: [], fees: [] };
}

/** `GET payments[?academicYearId]` : l'année courante par défaut. */
export function paymentsFixture(academicYearId?: string): Payment[] {
  return [...(academicYearId === YEAR.past ? PAST_PAYMENTS : PAYMENTS)];
}

/** Le PDF servi pour un reçu ou un relevé. */
export const PDF_BODY = '%PDF-1.4\n';
