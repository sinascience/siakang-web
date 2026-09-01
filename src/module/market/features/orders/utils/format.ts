import i18n from 'i18next';

// ----------------------------------------------------------------------
// `src/shared/utils/format.ts` (a currency formatter) doesn't exist in this
// repo — only date helpers do (`fDate`/`fDateTime`, reused directly from
// `src/shared/utils`) — and a new shared util is outside `allowed_paths`
// anyway. Same approach as `wallet/utils/format.ts`: a small local helper.
// ----------------------------------------------------------------------

function currentLocale(): string {
  return i18n.resolvedLanguage === 'en' ? 'en-US' : 'id-ID';
}

/** Order money — always Rupiah regardless of active UI language. Whole rupiah, never cents. */
export function formatIdr(amountIdr: number): string {
  return new Intl.NumberFormat(currentLocale(), {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountIdr);
}

/** Short, human-scannable order code from the uuid — the contract has no dedicated order number. */
export function formatOrderCode(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

/**
 * Countdown clock — digit format (`mm:ss`, or `h:mm:ss` past one hour) reads
 * the same regardless of active language, so it needs no i18n. Never negative:
 * callers clamp `remainingMs` to 0 before formatting.
 */
export function formatCountdownClock(remainingMs: number): string {
  const totalSeconds = Math.ceil(Math.max(0, remainingMs) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}
