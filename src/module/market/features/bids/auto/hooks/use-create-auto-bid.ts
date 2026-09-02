import type { Bid, CreateBidParams } from '../../types';

import i18n from 'i18next';
import { useState, useCallback } from 'react';

import { createBid } from '../../api';

// ----------------------------------------------------------------------

/**
 * `POST /bids` with `mode: 'auto'`. Charges `config.bid_auto_fee_idr` BEFORE
 * matching runs — a 402 here means nothing was written and no bid exists, so
 * the caller shows `<ErrorDialog>` and lets the user retry from a clean form,
 * never a half-created bid.
 */
export function useCreateAutoBid() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (params: CreateBidParams): Promise<Bid | null> => {
    setLoading(true);
    setError(null);
    try {
      const bid = await createBid(params);
      setLoading(false);
      return bid;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : i18n.t('bids-auto:errors.createFailed'));
      return null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { create, loading, error, clearError };
}
