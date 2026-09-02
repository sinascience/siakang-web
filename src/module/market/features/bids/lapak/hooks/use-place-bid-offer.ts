import type { BidOffer, PlaceOfferParams } from 'src/module/market/features/bids/types';

import i18n from 'i18next';
import { useState, useCallback } from 'react';

import { placeBidOffer } from 'src/module/market/features/bids/api';

// ----------------------------------------------------------------------
// `POST /bids/{id}/offers` mutation. One offer per lapak per bid — posting
// again REPLACES the amount/message and still returns 200/201, so this is a
// single "place or update" action, never a distinct update endpoint.
// ----------------------------------------------------------------------

export function usePlaceBidOffer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const place = useCallback(
    async (bidId: string, params: PlaceOfferParams): Promise<BidOffer | null> => {
      setLoading(true);
      setError(null);
      try {
        const offer = await placeBidOffer(bidId, params);
        setLoading(false);
        return offer;
      } catch (err) {
        setLoading(false);
        setError(err instanceof Error ? err.message : i18n.t('bids-lapak:errors.offerFailed'));
        return null;
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return { place, loading, error, clearError };
}
