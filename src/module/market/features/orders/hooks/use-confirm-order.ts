import type { Order } from '../types';

import i18n from 'i18next';
import { useState, useCallback } from 'react';

import { confirmOrder } from '../api';

// ----------------------------------------------------------------------

/**
 * `POST /orders/{id}/confirm` mutation. The call is idempotent, so an order
 * that the sweeper already auto-confirmed comes back `completed` on a 200 —
 * that is a success, and the caller distinguishes the two cases by reading
 * `auto_confirmed` on the returned order rather than by catching an error.
 */
export function useConfirmOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = useCallback(async (id: string): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const order = await confirmOrder(id);
      setLoading(false);
      return order;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : i18n.t('orders:errors.confirmFailed'));
      return null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { confirm, loading, error, clearError };
}
