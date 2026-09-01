// ----------------------------------------------------------------------
// contract/api-v1.yaml v1 (frozen) — GET /market/v1/orders, GET /market/v1/orders/{id}
//
// Orders are the spine of the marketplace: a product purchase, a gig-tier
// purchase, and an awarded bid all resolve into this SAME shape — only
// `source` differs. This screen is deliberately persona-neutral: it serves
// both the customer (orders they placed) and the lapak (orders placed
// against them). The backend scopes rows by the caller's JWT — there is no
// persona flag here, and none should be added.
// ----------------------------------------------------------------------

/**
 * `completed` is TERMINAL — there is no `done`, no `in_progress`. Once an
 * order is `awaiting_confirmation`, it either becomes `completed` (customer
 * confirmed, or the window elapsed — see `auto_confirmed`) or stays put.
 */
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'awaiting_confirmation'
  | 'completed'
  | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending_payment',
  'paid',
  'awaiting_confirmation',
  'completed',
  'cancelled',
];

/** Which flow produced this order. */
export type OrderSource = 'product' | 'gig' | 'bid_auto' | 'bid_manual';

export type OrderCustomer = {
  id: string;
  full_name: string;
};

export type OrderLapak = {
  id: string;
  name: string;
  rating: number;
};

export type OrderItemStatus = 'unpaid' | 'paid';

export type OrderItem = {
  id: string;
  product_id: string | null;
  gig_tier_id: string | null;
  /** Contract v1.0.3 — non-null exactly when `gig_tier_id` is. */
  gig_id: string | null;
  /** Snapshotted at order time — not a live product/gig-tier lookup. */
  name: string;
  /** Whole rupiah, NOT cents. */
  unit_price_idr: number;
  quantity: number;
  subtotal_idr: number;
  status: OrderItemStatus;
  created_at: string;
};

/**
 * An order can carry MORE THAN ONE payment (e.g. a gig order that was
 * upsold) — always render `payments` as a list, never as "the payment".
 */
export type Payment = {
  id: string;
  order_id: string;
  amount_idr: number;
  /** Which items this charge covered. */
  order_item_ids: string[];
  paid_at: string;
};

export type DeliveryStatus = 'none' | 'preparing' | 'shipped' | 'delivered';

export type Order = {
  id: string;
  source: OrderSource;
  status: OrderStatus;
  customer: OrderCustomer;
  lapak: OrderLapak;
  items: OrderItem[];
  payments: Payment[];
  /** Whole rupiah. Sum of every item. */
  total_idr: number;
  /** Whole rupiah. Sum of items in status `paid`. */
  paid_idr: number;
  /** Whole rupiah, server-computed — render as-is, never sum unpaid items client-side. */
  outstanding_idr: number;
  bid_id: string | null;
  chat_thread_id: string | null;
  /** Informational only — does not drive any status logic here. */
  delivery_status: DeliveryStatus;
  /** Set by `complete`; the confirm countdown reads this. */
  confirm_deadline_at: string | null;
  /** true = the confirm window elapsed and the customer did NOT click confirm. */
  auto_confirmed: boolean;
  completed_at: string | null;
  created_at: string;
};

export type OrderListParams = {
  page?: number;
  limit?: number;
  status?: OrderStatus | '';
};

/**
 * Per-status totals for the tab badges, PLUS `all`. Ignores the `status`
 * filter (but follows every other filter) — one list request drives every
 * tab badge, never fetch per status.
 */
export type OrderCounts = Partial<Record<OrderStatus, number>> & { all: number };

export type ListMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  counts?: OrderCounts;
};

/** `CreateOrderRequest` from the contract — exactly one of `product_id` / `gig_tier_id`. */
export type CreateOrderParams = {
  product_id?: string;
  gig_tier_id?: string;
  /** min 1, default 1 — products only. */
  quantity?: number;
};

/** `POST /orders/{id}/items` body — the flow-B upsell. Same field name as order creation. */
export type AddOrderItemParams = {
  gig_tier_id: string;
};

/** `PayResult` from the contract. `wallet_balance_idr` is the balance AFTER the charge. */
export type PayResult = {
  order: Order;
  payment: Payment;
  wallet_balance_idr: number;
};
