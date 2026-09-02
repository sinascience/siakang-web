import type { ApiEnvelope } from 'src/module/core/features/auth/types';

import i18n from 'i18next';
import { useState, useEffect } from 'react';

import axios, { endpoints } from 'src/shared/lib/axios';

// ----------------------------------------------------------------------
// Seeded platform config: the bid fees and the auto-confirm window.
//
// Master-owned and shared, because FE-E and FE-F both have a criterion that
// the fee is "shown from /market/v1/config (never hardcoded)" — two minors
// writing two fetchers for one endpoint is how 2 500 ends up as a literal in
// one of them.
//
// Module-level cache: the values are seeded and do not change within a
// session, and the alternative is refetching them on every screen that quotes
// a fee (docs/patterns/reference-data.md).
// ----------------------------------------------------------------------

export type PlatformConfig = {
  bid_auto_fee_idr: number;
  bid_manual_fee_idr: number;
  order_auto_confirm_seconds: number;
};

let cached: PlatformConfig | null = null;
let inFlight: Promise<PlatformConfig> | null = null;

function fetchConfig(): Promise<PlatformConfig> {
  if (cached) return Promise.resolve(cached);
  if (inFlight) return inFlight;

  inFlight = axios
    .get<ApiEnvelope<PlatformConfig>>(endpoints.market.config)
    .then((res) => {
      const data = res.data.data;
      if (!data) throw new Error(res.data.message || 'Empty response');
      cached = data;
      return data;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Clears the cache — call from the company/session invalidation path if one appears. */
export function invalidatePlatformConfig(): void {
  cached = null;
}

type State = {
  data: PlatformConfig | null;
  loading: boolean;
  error: string | null;
};

export function usePlatformConfig(): State {
  const [state, setState] = useState<State>({
    data: cached,
    loading: !cached,
    error: null,
  });

  useEffect(() => {
    if (cached) return undefined;

    let cancelled = false;
    fetchConfig()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          data: null,
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
