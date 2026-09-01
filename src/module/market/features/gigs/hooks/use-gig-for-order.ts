import type { Gig } from '../types';
import type { Order } from 'src/module/market/features/orders/types';

import i18n from 'i18next';
import { useState, useEffect } from 'react';

import { listGigs } from '../api';

// ----------------------------------------------------------------------
// Which gig does this order belong to?
//
// The frozen contract gives `OrderItem.gig_tier_id` but no `gig_id`, and there
// is no `GET /gig-tiers/{id}` — so the only way from an order back to its gig
// is to look for the gig that owns one of its tiers.
//
// ponytail: scans the first page of `GET /gigs` (limit 100) client-side. Fine
// while the seeded catalogue is tiny; the upgrade path is BE adding `gig_id` to
// `OrderItem` (or a tier lookup endpoint), after which this hook is one GET.
// Flagged to fe-master.
// ----------------------------------------------------------------------

const LOOKUP_LIMIT = 100;

type State = {
  data: Gig | null;
  loading: boolean;
  error: string | null;
};

/** Loads only while `enabled` — the upsell dialog passes its own `open`. */
export function useGigForOrder(order: Order | null, enabled: boolean): State {
  const [state, setState] = useState<State>({ data: null, loading: false, error: null });

  const tierKey = (order?.items ?? [])
    .map((item) => item.gig_tier_id)
    .filter(Boolean)
    .join(',');

  useEffect(() => {
    if (!enabled || !tierKey) return undefined;

    let cancelled = false;
    const tierIds = tierKey.split(',');

    setState({ data: null, loading: true, error: null });
    listGigs({ limit: LOOKUP_LIMIT })
      .then((result) => {
        if (cancelled) return;
        const gig = result.data.find((row) => row.tiers.some((tier) => tierIds.includes(tier.id)));
        setState({
          data: gig ?? null,
          loading: false,
          error: gig ? null : i18n.t('gigs:errors.gigNotFoundForOrder'),
        });
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
  }, [enabled, tierKey]);

  return state;
}
