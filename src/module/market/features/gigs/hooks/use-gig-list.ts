import type { Gig, ListMeta, GigListParams } from '../types';

import i18n from 'i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { listGigs } from '../api';

// ----------------------------------------------------------------------

type State = {
  data: Gig[];
  meta: ListMeta;
  loading: boolean;
  error: string | null;
};

const INITIAL_META: ListMeta = { page: 1, limit: 25, total: 0, total_pages: 0 };

/** BE-paginated gig list — same shape as catalog/hooks/use-product-list.ts. */
export function useGigList(params: GigListParams) {
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
      const result = await listGigs(stableParams);
      setState({ data: result.data, meta: result.meta, loading: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : i18n.t('gigs:errors.loadData'),
      }));
    }
  }, [stableParams]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
