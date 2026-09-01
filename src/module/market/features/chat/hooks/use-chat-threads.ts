import type { ChatThread } from '../types';

import i18n from 'i18next';
import { useState, useEffect, useCallback } from 'react';

import { listChatThreads } from '../api';

// ----------------------------------------------------------------------

type State = {
  data: ChatThread[];
  loading: boolean;
  error: string | null;
};

/**
 * The caller's threads, most recently active first (server order — never re-sorted here).
 *
 * ponytail: one page of 50. A conversation list this size fits a screen and a
 * scroll; add paging when a real account outgrows it.
 */
export function useChatThreads() {
  const [state, setState] = useState<State>({ data: [], loading: true, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const result = await listChatThreads({ limit: 50 });
      setState({ data: result.data, loading: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : i18n.t('chat:errors.loadThreads'),
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
