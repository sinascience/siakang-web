import type { Order } from '../types';

import i18n from 'i18next';
import { useState, useCallback } from 'react';

import { completeOrder } from '../api';

// ----------------------------------------------------------------------

/**
 * `POST /orders/{id}/complete` mutation. Lapak-only by contract; a pending
 * unpaid upsell item blocks it with a real `409`, left in `error` for the
 * caller's `<ErrorDialog>` rather than hiding the action.
 */
export function useCompleteOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = useCallback(async (id: string): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const order = await completeOrder(id);
      setLoading(false);
      return order;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : i18n.t('orders:errors.completeFailed'));
      return null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { complete, loading, error, clearError };
}
