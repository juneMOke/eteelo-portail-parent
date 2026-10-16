import { formatNumber } from '@angular/common';

/** Un montant en centimes de sa devise (ISO 4217) : jamais converti, jamais additionné à une autre devise. */
export interface Money {
  readonly amountInCents: number;
  readonly currency: string;
}

const SYMBOLS: Readonly<Record<string, string>> = { USD: '$', CDF: 'FC', EUR: '€' };

const SPOKEN: Readonly<Record<string, readonly [one: string, many: string]>> = {
  USD: ['dollar', 'dollars'],
  CDF: ['franc congolais', 'francs congolais'],
  EUR: ['euro', 'euros'],
};

/** Espace fine insécable, entre les milliers comme avant le symbole. */
const THIN_SPACE = ' ';

/** « 1 240 », « 12,50 » : les centimes seulement s'il y en a. */
function figure(amountInCents: number, locale: string): string {
  const digits = amountInCents % 100 === 0 ? '1.0-0' : '1.2-2';
  return formatNumber(amountInCents / 100, locale, digits);
}

/** « $ », « FC » ; le code ISO pour une devise sans symbole connu. */
export function currencySymbol(currency: string): string {
  return SYMBOLS[currency] ?? currency;
}

/** « 1 240 $ », « 224 000 FC » : espace fine, symbole après. */
export function amountLabel({ amountInCents, currency }: Money, locale: string): string {
  return `${figure(amountInCents, locale)}${THIN_SPACE}${currencySymbol(currency)}`;
}

/** Plusieurs devises côte à côte, jamais additionnées : « 80 $ · 50 000 FC ». */
export function amountsLabel(amounts: readonly Money[], locale: string): string {
  return amounts.map((money) => amountLabel(money, locale)).join(' · ');
}

/** « 260 dollars », « 224 000 francs congolais » : le même montant, pour un lecteur d'écran. */
export function spokenAmount({ amountInCents, currency }: Money, locale: string): string {
  const words = SPOKEN[currency];
  const value = figure(amountInCents, locale);
  if (!words) return `${value} ${currency}`;
  return `${value} ${amountInCents <= 100 ? words[0] : words[1]}`;
}
