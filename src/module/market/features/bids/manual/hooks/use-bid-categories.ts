import type { BidCategory } from '../../types';

import i18n from 'i18next';
import { useState, useEffect } from 'react';

import { listBidCategories } from '../../api';

// ----------------------------------------------------------------------
// Reference data (bid categories) for the manual-bid post form. Same
// module-level-cache shape as the parent module's `use-platform-config.ts`
// (docs/patterns/reference-data.md) — this wraps the already-written
// `listBidCategories()` fetcher from the shared `bids/api`, it does not
// duplicate the endpoint call. Lives here (not in the master-owned
// `bids/hooks/`) because only the manual-bid post form needs a category
// picker; FE-E's auto-bid flow may want the same shape later, in which case
// it belongs promoted to `bids/hooks/` — a master call, not this task's.
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
          error: err instanceof Error ? err.message : i18n.t('common:error.title'),
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
