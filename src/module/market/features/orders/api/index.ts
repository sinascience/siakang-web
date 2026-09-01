import type { ApiEnvelope } from 'src/module/core/features/auth/types';
import type { Order, ListMeta, PayResult, OrderCounts, OrderListParams, CreateOrderParams } from '../types';

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
