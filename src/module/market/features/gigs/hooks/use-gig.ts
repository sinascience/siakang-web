import type { Gig } from '../types';

import i18n from 'i18next';
import { useState, useEffect, useCallback } from 'react';

import { getGig } from '../api';

// ----------------------------------------------------------------------

type State = {
  data: Gig | null;
  loading: boolean;
  /** True when the id does not exist — renders a 404 state. */
  notFound: boolean;
  error: string | null;
};

const INITIAL_STATE: State = { data: null, loading: true, notFound: false, error: null };

/** Same shape as catalog/hooks/use-product.ts — deep-linkable, loads standalone. */
export function useGig(id: string | undefined) {
  const [state, setState] = useState<State>(INITIAL_STATE);

  const load = useCallback(async () => {
    if (!id) {
      setState({ data: null, loading: false, notFound: true, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await getGig(id);
      setState({ data, loading: false, notFound: false, error: null });
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      const isNotFound = status === 404;
      setState({
        data: null,
        loading: false,
        notFound: isNotFound,
        error: isNotFound ? null : i18n.t('gigs:errors.loadDetail'),
      });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
