import type { BidOffer } from 'src/module/market/features/bids/types';

import i18n from 'i18next';
import { useState, useEffect } from 'react';

import { listBidOffers } from 'src/module/market/features/bids/api';
import { useAuthContext } from 'src/module/core/features/auth/hooks';

// ----------------------------------------------------------------------
// There is no "my offer" field on the Bid the list already returns, and the
// contract has no per-lapak query param — the only way to know whether this
// lapak already offered on a bid is to read that one bid's offers. Fetched
// lazily when the offer dialog opens (same `enabledId` shape as
// docs/patterns/dialog-crud.md), not per row — a manual-bids table can list
// many bids, and checking each one on mount would be the N+1 fetch
// docs/CONVENTIONS.md rules out. The dialog itself carries the
// "place" vs "update" distinction the contract calls for.
// ----------------------------------------------------------------------

type State = {
  data: BidOffer | null;
  loading: boolean;
  error: string | null;
};

export function useMyBidOffer(bidId: string | null): State {
  const { lapak } = useAuthContext();
  const [state, setState] = useState<State>({ data: null, loading: !!bidId, error: null });

  useEffect(() => {
    if (!bidId || !lapak) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }

    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    listBidOffers(bidId)
      .then((offers) => {
        if (cancelled) return;
        const mine = offers.find((offer) => offer.lapak.id === lapak.id) ?? null;
        setState({ data: mine, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : i18n.t('bids-lapak:errors.loadFailed'),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [bidId, lapak]);

  return state;
}
