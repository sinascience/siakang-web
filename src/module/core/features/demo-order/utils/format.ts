import dayjs from 'dayjs';

// ----------------------------------------------------------------------
// Dummy data is IDR-only, so the currency is fixed and only the grouping is
// formatted — same approach as the Item demo row.
// ----------------------------------------------------------------------

const amountFormatter = new Intl.NumberFormat('id-ID');

export function fAmount(value: number): string {
  return `Rp ${amountFormatter.format(value)}`;
}

export function fDate(iso: string): string {
  return dayjs(iso).format('DD MMM YYYY');
}

export function fDateTime(iso: string): string {
  return dayjs(iso).format('DD MMM YYYY HH:mm');
}
