import type { Order } from '../types';

import i18n from 'i18next';
import { useState, useEffect, useCallback } from 'react';

import { getOrder } from '../api';

// ----------------------------------------------------------------------

type State = {
  data: Order | null;
  loading: boolean;
  /** True when the id does not exist — the detail page renders a 404 state. */
  notFound: boolean;
  error: string | null;
};

const INITIAL_STATE: State = { data: null, loading: true, notFound: false, error: null };

/**
 * Fetch a single order by id. The list endpoint returns a lighter row shape,
 * so a page-based detail view always loads its own copy — which also makes
 * deep-links and page refreshes work.
 */
export function useOrder(id: string | undefined) {
  const [state, setState] = useState<State>(INITIAL_STATE);

  const load = useCallback(async () => {
    if (!id) {
      setState({ data: null, loading: false, notFound: true, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await getOrder(id);
      setState({ data, loading: false, notFound: false, error: null });
    } catch (err) {
      const isNotFound = err instanceof Error && err.message === 'NOT_FOUND';
      setState({
        data: null,
        loading: false,
        notFound: isNotFound,
        error: isNotFound ? null : i18n.t('demo-order:errors.loadDetail'),
      });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
