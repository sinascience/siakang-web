import type { BidCategory } from '../../types';

import i18n from 'i18next';
import { useState, useEffect } from 'react';

import { listBidCategories } from '../../api';

// ----------------------------------------------------------------------
// `GET /market/v1/bid-categories` — a short, static, non-company-scoped list
// (see docs/patterns/reference-data.md's module-level cache pattern, same
// shape as `bids/hooks/use-platform-config.ts`). No invalidation hook is
// exported: unlike `usePlatformConfig`, nothing in this sprint ever changes
// or needs to bust this cache.
// ----------------------------------------------------------------------

let cached: BidCategory[] | null = null;
let inFlight: Promise<BidCategory[]> | null = null;

function fetchCategories(): Promise<BidCategory[]> {
  if (cached) return Promise.resolve(cached);
  if (inFlight) return inFlight;

  inFlight = listBidCategories()
    .then((data) => {
      cached = data;
      return data;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

type State = {
  data: BidCategory[];
  loading: boolean;
  error: string | null;
};

export function useBidCategories(): State {
  const [state, setState] = useState<State>({
    data: cached ?? [],
    loading: !cached,
    error: null,
  });

  useEffect(() => {
    if (cached) return undefined;

    let cancelled = false;
    fetchCategories()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          data: [],
          loading: false,
          error: err instanceof Error ? err.message : i18n.t('bids-auto:errors.loadCategories'),
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
