// Dummy data for the Finance dashboard. Numbers are illustrative only.

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export type Kpi = {
  value: number;
  delta: number;
  spark: number[];
};

export const financeKpis: Record<'revenue' | 'expense' | 'profit' | 'cash', Kpi> = {
  revenue: { value: 4_820_000_000, delta: 8.4, spark: [12, 18, 15, 22, 20, 28, 26, 31] },
  expense: { value: 2_960_000_000, delta: 3.1, spark: [20, 19, 22, 21, 24, 23, 25, 26] },
  profit: { value: 1_860_000_000, delta: 12.7, spark: [6, 9, 8, 12, 11, 15, 16, 19] },
  cash: { value: 3_240_000_000, delta: -2.3, spark: [30, 28, 31, 27, 29, 26, 28, 27] },
};

// Revenue vs expense, 12 months (in millions of IDR).
export const revenueSeries = [320, 358, 372, 401, 388, 430, 452, 441, 468, 489, 472, 520];
export const expenseSeries = [210, 228, 235, 244, 251, 246, 262, 258, 271, 268, 279, 286];

// Monthly cash flow (in / out, in millions of IDR).
export const cashInSeries = [410, 388, 442, 461, 451, 498, 512, 489, 531, 548, 522, 590];
export const cashOutSeries = [330, 351, 362, 374, 381, 366, 392, 388, 401, 398, 419, 426];

export type Category = { label: string; value: number };

export const expenseByCategory: Category[] = [
  { label: 'Payroll', value: 1_280_000_000 },
  { label: 'Operations', value: 720_000_000 },
  { label: 'Marketing', value: 480_000_000 },
  { label: 'Technology', value: 310_000_000 },
  { label: 'Other', value: 170_000_000 },
];

export type Budget = { label: string; used: number; total: number };

export const budgetUsage: Budget[] = [
  { label: 'Payroll', used: 1_280_000_000, total: 1_400_000_000 },
  { label: 'Operations', used: 720_000_000, total: 900_000_000 },
  { label: 'Marketing', used: 480_000_000, total: 500_000_000 },
  { label: 'Technology', used: 310_000_000, total: 600_000_000 },
];

export type TxStatus = 'completed' | 'pending' | 'failed';
export type Transaction = {
  id: string;
  name: string;
  date: string;
  amount: number;
  status: TxStatus;
};

export const recentTransactions: Transaction[] = [
  { id: 'INV-2031', name: 'PT Cahaya Abadi', date: '05 Jun 2026', amount: 124_500_000, status: 'completed' },
  { id: 'INV-2030', name: 'CV Mitra Sejati', date: '04 Jun 2026', amount: 58_200_000, status: 'pending' },
  { id: 'INV-2029', name: 'PT Sumber Makmur', date: '04 Jun 2026', amount: 312_000_000, status: 'completed' },
  { id: 'INV-2028', name: 'Toko Berkah Jaya', date: '03 Jun 2026', amount: 9_800_000, status: 'failed' },
  { id: 'INV-2027', name: 'PT Nusantara Tek', date: '02 Jun 2026', amount: 76_400_000, status: 'completed' },
];

export const txStatusColor: Record<TxStatus, 'success' | 'warning' | 'error'> = {
  completed: 'success',
  pending: 'warning',
  failed: 'error',
};
