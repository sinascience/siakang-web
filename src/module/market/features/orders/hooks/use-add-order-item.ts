import type { Order } from '../types';

import i18n from 'i18next';
import { useState, useCallback } from 'react';

import { addOrderItem } from '../api';

// ----------------------------------------------------------------------

/**
 * `POST /orders/{id}/items` mutation — adds an agreed gig tier to an order that
 * already exists. Returns the UPDATED order (with the new unpaid item and a
 * raised `outstanding_idr`), or `null` on failure with the message left in
 * `error` for the caller's `<ErrorDialog>`.
 *
 * No money moves here — the customer pays with the order's existing Pay action.
 */
export function useAddOrderItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = useCallback(async (id: string, gigTierId: string): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const order = await addOrderItem(id, { gig_tier_id: gigTierId });
      setLoading(false);
      return order;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : i18n.t('orders:errors.addItemFailed'));
      return null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { addItem, loading, error, clearError };
}
