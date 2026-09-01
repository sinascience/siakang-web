import type { PayResult } from '../api';

import i18n from 'i18next';
import { useState, useCallback } from 'react';

import { payOrder } from '../api';

// ----------------------------------------------------------------------

/**
 * `POST /orders/{id}/pay` mutation. Shared by the catalog checkout flow and
 * `order-detail-view.tsx`'s Pay action — same call either way, always against
 * an order id that already exists, so a retry after failure (insufficient
 * balance, etc.) never creates a second order.
 */
export function usePayOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = useCallback(async (id: string): Promise<PayResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await payOrder(id);
      setLoading(false);
      return result;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : i18n.t('orders:errors.payFailed'));
      return null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { pay, loading, error, clearError };
}
