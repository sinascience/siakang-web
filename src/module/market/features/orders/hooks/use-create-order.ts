import type { Order, CreateOrderParams } from '../types';

import i18n from 'i18next';
import { useState, useCallback } from 'react';

import { createOrder } from '../api';

// ----------------------------------------------------------------------

/**
 * `POST /orders` mutation. Returns the created order on success, `null` on
 * failure (message left in `error` for the caller to surface via
 * `<ErrorDialog>`). No money moves on this call — see `use-pay-order.ts` for
 * the separate charge.
 */
export function useCreateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (params: CreateOrderParams): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const order = await createOrder(params);
      setLoading(false);
      return order;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : i18n.t('orders:errors.createFailed'));
      return null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { create, loading, error, clearError };
}
