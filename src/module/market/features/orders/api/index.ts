import type { ApiEnvelope } from 'src/module/core/features/auth/types';
import type {
  Order,
  ListMeta,
  PayResult,
  OrderCounts,
  OrderListParams,
  CreateOrderParams,
  AddOrderItemParams,
} from '../types';

import axios, { endpoints, flattenFieldErrors } from 'src/shared/lib/axios';

// ----------------------------------------------------------------------

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const res = await promise;
  const payload = res.data;
  if (payload.data === null || payload.data === undefined) {
    const { errors } = payload;
    const detail =
      (typeof errors === 'string' ? errors : errors && flattenFieldErrors(errors)) ||
      payload.message ||
      'Empty response';
    throw new Error(detail);
  }
  return payload.data;
}

export async function listOrders(
  params: OrderListParams = {}
): Promise<{ data: Order[]; meta: ListMeta }> {
  const res = await axios.get<ApiEnvelope<Order[]>>(endpoints.market.orders.list, {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 25,
      status: params.status || undefined,
    },
  });
  const payload = res.data;
  const data = payload.data ?? [];
  const meta = payload.meta as
    | { pagination?: Omit<ListMeta, 'counts'>; counts?: OrderCounts }
    | null
    | undefined;
  const pagination = meta?.pagination;
  return {
    data,
    meta: {
      page: pagination?.page ?? 1,
      limit: pagination?.limit ?? data.length,
      total: pagination?.total ?? data.length,
      total_pages: pagination?.total_pages ?? 1,
      // counts ignore the `status` filter by contract — safe to use for every tab badge.
      counts: meta?.counts,
    },
  };
}

export function getOrder(id: string): Promise<Order> {
  return unwrap<Order>(axios.get(endpoints.market.orders.byId(id)));
}

// ----------------------------------------------------------------------
// Write side (FE-B) — `orders/types/index.ts` is outside this task's
// allowed_paths, so the request/response shapes that FE-G's read side didn't
// need live here instead, next to the calls that use them.
// ----------------------------------------------------------------------


/**
 * `POST /orders` — creates the order in `pending_payment` with one unpaid
 * item. No money moves here; the price comes from the server's own product
 * lookup. Never send a price.
 */
export function createOrder(params: CreateOrderParams): Promise<Order> {
  return unwrap<Order>(axios.post(endpoints.market.orders.list, params));
}

/**
 * `POST /orders/{id}/pay` — charges `order.outstanding_idr` in one
 * transaction. Insufficient balance is a real `402`; the order is left
 * untouched and still payable, so callers can retry with the SAME id.
 */
export function payOrder(id: string): Promise<PayResult> {
  return unwrap<PayResult>(axios.post(endpoints.market.orders.pay(id)));
}

/**
 * `POST /orders/{id}/items` — the flow-B upsell. Appends ONE unpaid item for
 * another tier of the same gig to the EXISTING order (no new order id), which
 * raises `total_idr` / `outstanding_idr` so the existing Pay action becomes
 * payable again and produces a SECOND payment row against the same order.
 *
 * There is no proposal entity: the lapak upsells in the order's chat thread,
 * and the customer agreeing IS this call.
 */
export function addOrderItem(id: string, params: AddOrderItemParams): Promise<Order> {
  return unwrap<Order>(axios.post(endpoints.market.orders.items(id), params));
}

/**
 * `POST /orders/{id}/confirm` — customer confirms the work is done; moves the
 * order to `completed` and credits the lapak.
 *
 * IDEMPOTENT by contract: if the auto-confirm window elapsed first the order is
 * already `completed`, and this returns it unchanged rather than paying twice.
 * A `completed` order coming back is SUCCESS, never an error — callers read
 * `auto_confirmed` to label which of the two actually happened.
 */
export function confirmOrder(id: string): Promise<Order> {
  return unwrap<Order>(axios.post(endpoints.market.orders.confirm(id)));
}

/**
 * `POST /orders/{id}/complete` — the lapak marks a `paid` order as work-done.
 * Moves the order to `awaiting_confirmation` and starts the customer's
 * confirm countdown. No money moves here — the lapak is paid at `confirm`.
 *
 * A pending upsell item (added but unpaid) blocks this with a real `409`;
 * callers surface that message rather than hiding the action, since the
 * lapak needs to understand the customer still owes money.
 */
export function completeOrder(id: string): Promise<Order> {
  return unwrap<Order>(axios.post(endpoints.market.orders.complete(id)));
}
