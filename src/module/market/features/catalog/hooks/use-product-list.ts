import type { Product, ListMeta, ProductListParams } from '../types';

import i18n from 'i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { listProducts } from '../api';

// ----------------------------------------------------------------------

type State = {
  data: Product[];
  meta: ListMeta;
  loading: boolean;
  error: string | null;
};

const INITIAL_META: ListMeta = { page: 1, limit: 25, total: 0, total_pages: 0 };

/** BE-paginated product list — same shape as orders/hooks/use-order-list.ts. */
export function useProductList(params: ProductListParams) {
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
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const result = await listProducts(stableParams);
      setState({ data: result.data, meta: result.meta, loading: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : i18n.t('catalog:errors.loadData'),
      }));
    }
  }, [stableParams]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
