import type { Bid, BidListMeta, BidListParams } from 'src/module/market/features/bids/types';

import i18n from 'i18next';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { listBids } from 'src/module/market/features/bids/api';

// ----------------------------------------------------------------------
// Same shape as orders/hooks/use-order-list.ts, plus a modest interval poll:
// the contract has no push channel for bids (only chat.message/auth.expired
// over SSE, and that stream is chat-only), so a refresh control or a light
// poll is the documented correct approach — not a defect to "fix" later.
// ----------------------------------------------------------------------

type State = {
  data: Bid[];
  meta: BidListMeta;
  loading: boolean;
  error: string | null;
};

const INITIAL_META: BidListMeta = { page: 1, limit: 25, total: 0, total_pages: 0 };

/** ponytail: fixed interval, no backoff — dataset is small and this is sprint-1. */
const POLL_MS = 20_000;

export function useLapakBidList(params: BidListParams) {
  const key = JSON.stringify(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableParams = useMemo(() => params, [key]);

  const [state, setState] = useState<State>({
    data: [],
    meta: INITIAL_META,
    loading: true,
    error: null,
  });

  // Poll ticks call the latest `load` without resubscribing the interval.
  const loadRef = useRef<() => void>(() => {});

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const result = await listBids(stableParams);
      setState({ data: result.data, meta: result.meta, loading: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : i18n.t('bids-lapak:errors.loadFailed'),
      }));
    }
  }, [stableParams]);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => loadRef.current(), POLL_MS);
    return () => clearInterval(id);
  }, []);

  return { ...state, refresh: load };
}
