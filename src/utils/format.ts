import { APP_CURRENCY, APP_LOCALE, TVA_RATE, amountTTC } from '@/config/france';

export function formatCurrency(value: number, locale = APP_LOCALE): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: APP_CURRENCY,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Montants devis / lignes — conserve les centimes (ex. 0,05 €). */
export function formatCurrencyPrecise(value: number, locale = APP_LOCALE): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: APP_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Montant HT avec libellé français. */
export function formatCurrencyHT(value: number): string {
  return `${formatCurrency(value)} HT`;
}

export function formatCurrencyTTC(ht: number): string {
  return `${formatCurrency(amountTTC(ht, TVA_RATE))} TTC`;
}

/** Date française DD/MM/YYYY */
export function formatDate(date: string, locale = APP_LOCALE): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date, locale = APP_LOCALE): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** Nombre français (espace insécable milliers). */
export function formatNumber(value: number, locale = APP_LOCALE): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)} %`;
}

export function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
}
