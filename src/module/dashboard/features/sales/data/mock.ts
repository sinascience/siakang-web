// Dummy data for the Sales dashboard. Numbers are illustrative only.

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

export type Kpi = { value: number; delta: number; spark: number[] };

export const salesKpis: Record<'sales' | 'orders' | 'conversion' | 'aov', Kpi> = {
  sales: { value: 1_284_000_000, delta: 14.2, spark: [8, 12, 10, 15, 14, 18, 20, 24] },
  orders: { value: 3_842, delta: 6.7, spark: [240, 268, 255, 290, 305, 330, 352, 384] },
  conversion: { value: 3.8, delta: 0.4, spark: [3.1, 3.2, 3.0, 3.4, 3.5, 3.6, 3.7, 3.8] },
  aov: { value: 334_000, delta: -1.2, spark: [340, 338, 342, 336, 339, 335, 333, 334] },
};

// Monthly sales (in millions of IDR).
export const salesSeries = [78, 86, 82, 95, 101, 112, 108, 121, 118, 132, 128, 145];

export type Source = { label: string; value: number };

export const trafficSources: Source[] = [
  { label: 'Organic', value: 42 },
  { label: 'Direct', value: 26 },
  { label: 'Referral', value: 15 },
  { label: 'Social', value: 11 },
  { label: 'Paid', value: 6 },
];

export type Channel = { label: string; value: number };

export const salesByChannel: Channel[] = [
  { label: 'Web', value: 540 },
  { label: 'Mobile', value: 612 },
  { label: 'Marketplace', value: 388 },
  { label: 'Retail', value: 244 },
];

export type Product = { name: string; sold: number; revenue: number; share: number };

export const topProducts: Product[] = [
  { name: 'Wireless Earbuds Pro', sold: 1_284, revenue: 428_000_000, share: 100 },
  { name: 'Smart Watch Series 6', sold: 962, revenue: 356_000_000, share: 83 },
  { name: 'Mechanical Keyboard', sold: 744, revenue: 212_000_000, share: 58 },
  { name: '4K Action Camera', sold: 518, revenue: 184_000_000, share: 43 },
  { name: 'Portable SSD 1TB', sold: 402, revenue: 121_000_000, share: 31 },
];

export type FunnelStep = { label: string; value: number };

export const conversionFunnel: FunnelStep[] = [
  { label: 'Visits', value: 100_000 },
  { label: 'Product views', value: 58_000 },
  { label: 'Add to cart', value: 21_400 },
  { label: 'Checkout', value: 9_600 },
  { label: 'Purchase', value: 3_842 },
];
