import { useState, useEffect } from 'react';

// ----------------------------------------------------------------------

type CountdownState = {
  /** Never negative — clamped to 0 once the deadline passes. */
  remainingMs: number;
  expired: boolean;
};

/**
 * Ticks once a second while `active` (i.e. `status === 'awaiting_confirmation'`)
 * and clears the interval on unmount or once `active` flips false — per the
 * task file's "clear it on unmount and when the order is no longer
 * awaiting_confirmation".
 *
 * Deliberately does NOT poll the order or refetch anything: the backend
 * sweeper flips the status roughly every 10s, so a countdown that reads
 * `expired: true` while the order is still `awaiting_confirmation` is
 * expected, not a bug. A refresh/revisit is enough to pick up the flip.
 */
export function useConfirmCountdown(deadlineAt: string | null, active: boolean): CountdownState {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active || !deadlineAt) return undefined;

    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [active, deadlineAt]);

  if (!deadlineAt) {
    return { remainingMs: 0, expired: false };
  }

  const remainingMs = Date.parse(deadlineAt) - now;
  return { remainingMs: Math.max(0, remainingMs), expired: remainingMs <= 0 };
}
