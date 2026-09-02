import type { Bid, CreateBidParams } from '../../types';

import i18n from 'i18next';
import { useState, useCallback } from 'react';

import { createBid } from '../../api';

// ----------------------------------------------------------------------

/**
 * `POST /bids` with `mode: 'manual'` fixed here. Free to post — no charge,
 * no confirmation step; the fee only applies at award (`use-award-offer.ts`).
 */
export function useCreateManualBid() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (params: Omit<CreateBidParams, 'mode'>): Promise<Bid | null> => {
    setLoading(true);
    setError(null);
    try {
      const bid = await createBid({ ...params, mode: 'manual' });
      setLoading(false);
      return bid;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : i18n.t('bids-manual:errors.createFailed'));
      return null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { create, loading, error, clearError };
}
