import type { LedgerEntryType } from '../types';
import type { LabelColor } from 'src/shared/ui/label';

import i18n from 'i18next';

// ----------------------------------------------------------------------
// `src/shared/utils/format.ts` (a currency formatter) doesn't exist in this
// repo yet — only `format-time.ts` does — and it's outside `allowed_paths`
// anyway. Per the task file, that means a small local helper here rather
// than a new shared util.
// ----------------------------------------------------------------------

function currentLocale(): string {
  return i18n.resolvedLanguage === 'en' ? 'en-US' : 'id-ID';
}

/** Wallet balance — always Rupiah regardless of active UI language. */
export function formatIdr(amountIdr: number): string {
  return new Intl.NumberFormat(currentLocale(), {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountIdr);
}

/**
 * Ledger amount — signed by contract (negative = left the wallet, positive =
 * arrived). `Intl` already prints the "-" for negative values; a leading "+"
 * is added for positive ones so the direction reads at a glance. Never
 * `Math.abs()` — that would erase the sign the contract requires rendering.
 */
export function formatSignedIdr(amountIdr: number): string {
  const formatted = formatIdr(amountIdr);
  return amountIdr > 0 ? `+${formatted}` : formatted;
}

export const LEDGER_TYPE_COLOR: Record<LedgerEntryType, LabelColor> = {
  topup: 'success',
  refund: 'success',
  order_payment: 'error',
  platform_fee: 'error',
  payout: 'error',
};
