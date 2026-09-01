import type { Order } from '../types';

import i18n from 'i18next';
import { useState, useEffect, useCallback } from 'react';

import { getOrder } from '../api';

// ----------------------------------------------------------------------

type State = {
  data: Order | null;
  loading: boolean;
  /** True when the id does not exist (or belongs to another caller) — renders a 404 state. */
  notFound: boolean;
  error: string | null;
};

const INITIAL_STATE: State = { data: null, loading: true, notFound: false, error: null };

/**
 * Fetch a single order by id. The list endpoint returns the full `Order`
 * shape too, but the detail page always loads its own copy — it is a route
 * (deep-linked into from catalog/gig/bid flows), so it must work standalone
 * on refresh and on first visit, not only when navigated from the list.
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
      const status = (err as Error & { status?: number }).status;
      const isNotFound = status === 404;
      setState({
        data: null,
        loading: false,
        notFound: isNotFound,
        error: isNotFound ? null : i18n.t('orders:errors.loadDetail'),
      });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
