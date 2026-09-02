import type { Bid } from '../../types';

import i18n from 'i18next';
import { useState, useEffect, useCallback } from 'react';

import { getBid } from '../../api';

// ----------------------------------------------------------------------

type State = {
  data: Bid | null;
  loading: boolean;
  /** True when the id does not exist (or belongs to another caller) — renders a 404 state. */
  notFound: boolean;
  error: string | null;
};

const INITIAL_STATE: State = { data: null, loading: true, notFound: false, error: null };

/**
 * Fetch a single bid by id. Deliberately does NOT poll — nothing external
 * flips a manual bid's own status except this customer's own award action,
 * so a `refresh()` after that mutation is all the freshness this needs. The
 * thing that changes from OTHER actors (lapak offers) is the offers list —
 * see `use-bid-offers.ts`.
 */
export function useManualBid(id: string | undefined) {
  const [state, setState] = useState<State>(INITIAL_STATE);

  const load = useCallback(async () => {
    if (!id) {
      setState({ data: null, loading: false, notFound: true, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await getBid(id);
      setState({ data, loading: false, notFound: false, error: null });
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      const isNotFound = status === 404;
      setState({
        data: null,
        loading: false,
        notFound: isNotFound,
        error: isNotFound ? null : i18n.t('bids-manual:errors.loadDetail'),
      });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
