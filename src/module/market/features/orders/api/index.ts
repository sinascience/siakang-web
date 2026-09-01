import type { ApiEnvelope } from 'src/module/core/features/auth/types';
import type { Order, ListMeta, OrderCounts, OrderListParams } from '../types';

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
