import type { Order, ListMeta, OrderListParams } from '../types';

import i18n from 'i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { listOrders } from '../api';

// ----------------------------------------------------------------------

type State = {
  data: Order[];
  meta: ListMeta;
  loading: boolean;
  error: string | null;
};

const INITIAL_META: ListMeta = { page: 1, limit: 25, total: 0, total_pages: 0 };

/**
 * BE-paginated, server-scoped by the caller's JWT (works unchanged for a
 * customer viewing their own orders and a lapak viewing orders against
 * them). `meta.counts` rides along on every call and drives every status
 * tab's badge — never fetch per status.
 */
export function useOrderList(params: OrderListParams) {
  const key = JSON.stringify(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableParams = useMemo(() => params, [key]);

  const [state, setState] = useState<State>({
    data: [],
    meta: INITIAL_META,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    // Keep the previous rows visible while refetching — see
    // docs/CONVENTIONS.md § List loading UX.
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const result = await listOrders(stableParams);
      setState({ data: result.data, meta: result.meta, loading: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : i18n.t('orders:errors.loadData'),
      }));
    }
  }, [stableParams]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
