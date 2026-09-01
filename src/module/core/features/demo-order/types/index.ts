// ----------------------------------------------------------------------
// Demo module — "Order" entity.
//
// Companion to the Item demo, but with a PAGE-BASED detail view instead of a
// dialog: the list navigates to /demo/order/:id. Use this as the reference
// when an entity is too heavy for a dialog (line items, timeline, deep-link).
//
// Backed by an in-memory dummy store (see ../api) — no real backend.
// ----------------------------------------------------------------------

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'shipped',
  'completed',
  'cancelled',
];

export type PaymentMethod = 'transfer' | 'card' | 'ewallet' | 'cod';

export type OrderLine = {
  id: string;
  sku: string;
  name: string;
  qty: number;
  unit_price: number;
};

export type OrderEvent = {
  status: OrderStatus;
  at: string;
};

/**
 * Row shape returned by the list endpoint — deliberately lighter than the
 * detail shape (no `lines`, no `timeline`), the way a real paginated list
 * behaves. This is what makes the detail page do its own fetch by id.
 */
export type OrderListItem = {
  id: string;
  number: string;
  customer_name: string;
  status: OrderStatus;
  item_count: number;
  total: number;
  created_at: string;
};

export type Order = OrderListItem & {
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  payment_method: PaymentMethod;
  lines: OrderLine[];
  subtotal: number;
  shipping_cost: number;
  discount: number;
  updated_at: string;
  timeline: OrderEvent[];
};

export type OrderListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus | '';
};
