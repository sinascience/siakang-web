import type { ChatMessage } from '../types';

import i18n from 'i18next';
import { useState, useEffect, useCallback } from 'react';

import { listChatMessages } from '../api';

// ----------------------------------------------------------------------

/**
 * One thread's transcript, oldest first.
 *
 * ponytail: the newest page only (50). Add "load older" when a thread routinely
 * runs past one page — the merge below already tolerates a second source.
 */
export function useChatMessages(threadId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Rejects as well as reporting, so the stream hook can count a failed attempt. */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listChatMessages(threadId);
      // The contract returns newest first (right for paging); a transcript reads
      // oldest first. The array order already says which is which — reverse it,
      // never re-sort on the date string.
      const history = [...data].reverse();
      setMessages((prev) => {
        const inHistory = new Set(history.map((m) => m.id));
        // Whatever we hold that this page did not contain arrived on the stream
        // after the server took the snapshot, so it belongs after it.
        return [...history, ...prev.filter((m) => !inHistory.has(m.id))];
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('chat:errors.loadMessages'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  /** Stream delivery. Dedupe by id — a refetch after a reconnect legitimately overlaps. */
  const append = useCallback((message: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }, []);

  useEffect(() => {
    setMessages([]);
    refresh().catch(() => {
      // already surfaced as `error`
    });
  }, [refresh]);

  return { messages, loading, error, refresh, append };
}
