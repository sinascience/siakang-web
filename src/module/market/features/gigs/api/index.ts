import type { Gig, ListMeta, GigListParams } from '../types';
import type { ApiEnvelope } from 'src/module/core/features/auth/types';

import axios, { endpoints, flattenFieldErrors } from 'src/shared/lib/axios';

// ----------------------------------------------------------------------
// Same `unwrap<T>()` shape as catalog/api and orders/api — each feature carries
// its own copy (docs/CONVENTIONS.md banner: `src/shared/api/index.ts` is an
// empty stub, not a real shared helper).
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

export async function listGigs(
  params: GigListParams = {}
): Promise<{ data: Gig[]; meta: ListMeta }> {
  const res = await axios.get<ApiEnvelope<Gig[]>>(endpoints.market.gigs.list, {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 25,
      q: params.q || undefined,
    },
  });
  const payload = res.data;
  const data = payload.data ?? [];
  const pagination = (payload.meta as { pagination?: ListMeta } | null | undefined)?.pagination;
  return {
    data,
    meta: {
      page: pagination?.page ?? 1,
      limit: pagination?.limit ?? data.length,
      total: pagination?.total ?? data.length,
      total_pages: pagination?.total_pages ?? 1,
    },
  };
}

export function getGig(id: string): Promise<Gig> {
  return unwrap<Gig>(axios.get(endpoints.market.gigs.byId(id)));
}
