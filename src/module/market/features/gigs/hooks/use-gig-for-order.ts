import type { Gig } from '../types';
import type { Order } from 'src/module/market/features/orders/types';

import i18n from 'i18next';
import { useState, useEffect } from 'react';

import { getGig } from '../api';

// ----------------------------------------------------------------------
// Which gig does this order belong to?
//
// Contract v1.0.3 put `gig_id` on `OrderItem` — non-null exactly when
// `gig_tier_id` is — so this is one `GET /gigs/{id}`.
//
// It previously scanned the first page of `GET /gigs` and matched by tier id,
// because nothing in the contract led from an order back to its gig. That held
// only while the catalogue was small: past the first hundred gigs it returned
// nothing, silently, and the upsell dialog came up empty. The amendment removed
// the need for it entirely.
// ----------------------------------------------------------------------

type State = {
  data: Gig | null;
  loading: boolean;
  error: string | null;
};

/** Loads only while `enabled` — the upsell dialog passes its own `open`. */
export function useGigForOrder(order: Order | null, enabled: boolean): State {
  const [state, setState] = useState<State>({ data: null, loading: false, error: null });

  const gigId = (order?.items ?? []).find((item) => item.gig_id)?.gig_id ?? null;

  useEffect(() => {
    if (!enabled || !gigId) return undefined;

    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    getGig(gigId)
      .then((gig) => {
        if (cancelled) return;
        setState({ data: gig, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : i18n.t('gigs:errors.loadData'),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, gigId]);

  return state;
}
