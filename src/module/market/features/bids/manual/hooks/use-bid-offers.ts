import type { BidOffer } from '../../types';

import i18n from 'i18next';
import { useRef, useState, useEffect, useCallback } from 'react';

import { listBidOffers } from '../../api';

// ----------------------------------------------------------------------
// There is no push channel for bids anywhere in the contract (the only SSE
// events are `chat.message` and `auth.expired`, on the chat stream only) —
// so a modest interval poll while the bid is still `open` is the correct
// implementation, paired with the manual refresh button in the view. Stops
// polling once the bid leaves `open` (awarded/ordered/cancelled): nothing
// external can add offers past that point.
// ----------------------------------------------------------------------

const POLL_MS = 5000;

type State = {
  data: BidOffer[];
  loading: boolean;
  error: string | null;
};

const INITIAL_STATE: State = { data: [], loading: true, error: null };

export function useBidOffers(bidId: string | undefined, poll: boolean) {
  const [state, setState] = useState<State>(INITIAL_STATE);
  const inFlightRef = useRef(false);

  const load = useCallback(async () => {
    if (!bidId || inFlightRef.current) return;
    inFlightRef.current = true;
    // First load only: keep existing rows visible on poll ticks/manual refresh.
    setState((s) => ({ ...s, loading: s.data.length === 0, error: null }));
    try {
      const data = await listBidOffers(bidId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : i18n.t('bids-manual:errors.loadOffers'),
      }));
    } finally {
      inFlightRef.current = false;
    }
  }, [bidId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!poll || !bidId) return undefined;
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [poll, bidId, load]);

  return { ...state, refresh: load };
}
