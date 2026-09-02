import type { Bid } from '../../types';

import i18n from 'i18next';
import { useState, useCallback } from 'react';

import { confirmBid } from '../../api';

// ----------------------------------------------------------------------

/** `POST /bids/{id}/confirm` — the customer's half of the automatic flow. No money moves. */
export function useConfirmAutoBid() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = useCallback(async (id: string): Promise<Bid | null> => {
    setLoading(true);
    setError(null);
    try {
      const bid = await confirmBid(id);
      setLoading(false);
      return bid;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : i18n.t('bids-auto:errors.confirmFailed'));
      return null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { confirm, loading, error, clearError };
}
