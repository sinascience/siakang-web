import type { Wallet } from '../types';

import i18n from 'i18next';
import { useState, useEffect, useCallback } from 'react';

import { getWallet } from '../api';

// ----------------------------------------------------------------------

type State = {
  data: Wallet | null;
  loading: boolean;
  error: string | null;
};

const INITIAL: State = { data: null, loading: true, error: null };

/**
 * `/market/v1/*` runs `JWTAuth()` only (not company-scoped — see
 * `src/shared/lib/axios.ts`), so unlike core/finance reference hooks this one
 * has no `companyVersion` dependency to refetch on company switch.
 */
export function useWallet() {
  const [state, setState] = useState<State>(INITIAL);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await getWallet();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : i18n.t('wallet:errors.loadData'),
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
