import type { OrderListItem, OrderListParams } from '../types';

import i18n from 'i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { listOrdersPaginated } from '../api';

// ----------------------------------------------------------------------

type Meta = { page: number; limit: number; total: number; total_pages: number };

type State = {
  data: OrderListItem[];
  meta: Meta;
  loading: boolean;
  error: string | null;
};

const INITIAL_META: Meta = { page: 1, limit: 25, total: 0, total_pages: 0 };

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
      const result = await listOrdersPaginated(stableParams);
      setState({ data: result.data, meta: result.meta, loading: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : i18n.t('demo-order:errors.loadData'),
      }));
    }
  }, [stableParams]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
