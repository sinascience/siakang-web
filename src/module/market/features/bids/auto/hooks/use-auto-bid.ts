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
 * There is no push channel for bids anywhere in the contract (the only SSE
 * events in the whole thing are `chat.message` / `auth.expired`, and they
 * live on the chat stream, not here). This is deliberately a plain refetch —
 * a manual "Segarkan" button always works, and while `status ===
 * 'customer_confirmed'` (waiting on the lapak — the ONE place a poll belongs
 * per the task file) it also self-polls on a modest interval. Cleared on
 * unmount and the moment status stops being `customer_confirmed`.
 */
const POLL_INTERVAL_MS = 6000;

export function useAutoBid(id: string | undefined) {
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
        error: isNotFound ? null : i18n.t('bids-auto:errors.loadDetail'),
      });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const waitingOnLapak = state.data?.status === 'customer_confirmed';

  useEffect(() => {
    if (!waitingOnLapak) return undefined;
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [waitingOnLapak, load]);

  return { ...state, refresh: load };
}
