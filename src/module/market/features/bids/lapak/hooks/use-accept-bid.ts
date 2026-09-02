import type { Bid } from 'src/module/market/features/bids/types';

import i18n from 'i18next';
import { useState, useCallback } from 'react';

import { acceptBid } from 'src/module/market/features/bids/api';

// ----------------------------------------------------------------------
// `POST /bids/{id}/accept` mutation. Only works from `customer_confirmed` —
// a `proposed` bid the customer hasn't confirmed yet returns a real 409,
// left in `error` for the caller's `<ErrorDialog>`. The UI is expected to
// hide the Accept button before `customer_confirmed` (see AutoBidsTable),
// so a 409 here means the row went stale between poll ticks, not a bug.
// ----------------------------------------------------------------------

export function useAcceptBid() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = useCallback(async (id: string): Promise<Bid | null> => {
    setLoading(true);
    setError(null);
    try {
      const bid = await acceptBid(id);
      setLoading(false);
      return bid;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : i18n.t('bids-lapak:errors.acceptFailed'));
      return null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { accept, loading, error, clearError };
}
