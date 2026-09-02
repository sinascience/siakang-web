import type { Bid } from '../../types';

import i18n from 'i18next';
import { useState, useCallback } from 'react';

import { awardBidOffer } from '../../api';

// ----------------------------------------------------------------------

/**
 * `POST /bids/{id}/offers/{offerId}/award` — charges `config.bid_manual_fee_idr`
 * and creates the tracked order in the same transaction, priced from the
 * AWARDED OFFER (never the posted budget). A 402 means the wallet could not
 * cover the fee: nothing was awarded, the bid stays `open`, the offer stays
 * `pending` — the server's error message says so and is surfaced verbatim
 * via `<ErrorDialog>`, never replaced with generic copy.
 */
export function useAwardOffer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const award = useCallback(async (bidId: string, offerId: string): Promise<Bid | null> => {
    setLoading(true);
    setError(null);
    try {
      const bid = await awardBidOffer(bidId, offerId);
      setLoading(false);
      return bid;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : i18n.t('bids-manual:errors.awardFailed'));
      return null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { award, loading, error, clearError };
}
