import type { ApiEnvelope } from 'src/module/core/features/auth/types';
import type { Wallet, ListMeta, LedgerEntry, WalletLedgerListParams } from '../types';

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

export function getWallet(): Promise<Wallet> {
  return unwrap<Wallet>(axios.get(endpoints.market.wallet.root));
}

export async function listWalletLedger(
  params: WalletLedgerListParams = {}
): Promise<{ data: LedgerEntry[]; meta: ListMeta }> {
  const res = await axios.get<ApiEnvelope<LedgerEntry[]>>(endpoints.market.wallet.ledger, {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 25,
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
