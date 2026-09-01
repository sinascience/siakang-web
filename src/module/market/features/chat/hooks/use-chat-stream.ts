import type { ChatMessage } from '../types';

import { useRef, useState, useEffect } from 'react';

import { endpoints } from 'src/shared/lib/axios';
import { getAccessToken } from 'src/module/core/features/auth/context/jwt/utils';

// ----------------------------------------------------------------------

export type ChatStreamStatus = 'connecting' | 'live' | 'offline';

type Options = {
  threadId: string | undefined;
  /** A `chat.message` frame. The sender's own message is echoed on their stream too. */
  onMessage: (message: ChatMessage) => void;
  /**
   * Called on every (re)connect and before every token refresh. Must be the
   * axios-backed history refetch:
   *
   * - the stream carries no event ids, so there is no resume-from-cursor — a
   *   refetch is the only correct way to close the gap a drop leaves;
   * - it doubles as this hook's token refresh. A stale token makes the GET 401,
   *   which `src/shared/lib/axios.ts` answers by refreshing *once* behind a
   *   shared promise and retrying. Calling the refresh endpoint from here
   *   instead would race that promise, and with rotating refresh tokens the
   *   loser of the race gets signed out.
   */
  onResync: () => Promise<void>;
};

/** Consecutive reconnects needing a fresh token before we stop retrying. */
const MAX_AUTH_ATTEMPTS = 3;

/**
 * Live delivery for one thread.
 *
 * `EventSource` already reconnects by itself on the server's `retry:` interval,
 * so this hook deliberately owns only the two cases the browser will not heal:
 * a handshake that never becomes a stream (the 401), and a stream the server
 * closes in-band with `auth.expired`. Both need a new token before reopening,
 * and both are handled the same way.
 */
export function useChatStream({ threadId, onMessage, onResync }: Options) {
  const [status, setStatus] = useState<ChatStreamStatus>('connecting');

  // Held in a ref so that a caller re-rendering its callbacks never tears down
  // a healthy connection — the effect depends on the thread id and nothing else.
  const handlers = useRef({ onMessage, onResync });
  useEffect(() => {
    handlers.current = { onMessage, onResync };
  });

  useEffect(() => {
    if (!threadId) return undefined;

    const id = threadId;
    let source: EventSource | null = null;
    let disposed = false;
    let authAttempts = 0;

    function close() {
      source?.close();
      source = null;
    }

    async function reopenWithFreshToken() {
      close();
      authAttempts += 1;
      if (authAttempts > MAX_AUTH_ATTEMPTS) {
        // Refreshing is not getting us a working stream. Stop hammering; the
        // page stays usable, live delivery does not.
        setStatus('offline');
        return;
      }
      setStatus('connecting');
      try {
        await handlers.current.onResync();
      } catch {
        // Refresh or network is down. The attempt counter ends the loop; the
        // awaited round trip keeps it from spinning in the meantime.
      }
      if (disposed) return;
      open();
    }

    function open() {
      // Never hold two: `auth.expired` and `onerror` can both fire for the same
      // dead connection, and the loser of that race would leak its EventSource.
      close();

      // Read the token on every open: after a refresh, the one we last
      // connected with is stale.
      const token = getAccessToken();
      if (!token) {
        setStatus('offline');
        return;
      }

      const es = new EventSource(endpoints.market.chat.stream(id, token));
      source = es;

      es.onopen = () => {
        setStatus('live');
        authAttempts = 0;
        // Refetch on every open, the first one included: it closes both the gap
        // a reconnect leaves and the window between the initial history load
        // and the stream coming up. Overlap is absorbed by the id dedupe.
        handlers.current.onResync().catch(() => {});
      };

      es.addEventListener('chat.message', (event) => {
        try {
          handlers.current.onMessage(JSON.parse((event as MessageEvent).data) as ChatMessage);
        } catch {
          // One unreadable frame is not worth dropping a working connection.
        }
      });

      // Once the stream is open the status line is long gone, so the server
      // cannot answer 401 any more: it says so in-band and closes. Same cure.
      es.addEventListener('auth.expired', () => {
        reopenWithFreshToken();
      });

      es.onerror = () => {
        // CONNECTING means the browser is already retrying on the `retry:`
        // interval — a loop of our own here would make two. CLOSED means it is
        // not retrying (a non-2xx handshake, i.e. the 401) and it is ours.
        if (es.readyState === EventSource.CLOSED) {
          reopenWithFreshToken();
        } else {
          setStatus('connecting');
        }
      };
    }

    open();

    // Unmount and every thread change: one visited thread must not leave one
    // live connection behind.
    return () => {
      disposed = true;
      close();
    };
  }, [threadId]);

  return { status };
}
