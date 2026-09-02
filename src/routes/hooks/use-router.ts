import type { NavigateOptions } from 'react-router';

import NProgress from 'nprogress';
import { useNavigate } from 'react-router';
import { useMemo, useCallback } from 'react';
import { isEqualPath } from 'minimal-shared/utils';

// ----------------------------------------------------------------------

/**
 * Customized useRouter hook with NProgress integration.
 */

export function useRouter() {
  const navigate = useNavigate();

  const push = useCallback(
    (href: string, options?: NavigateOptions) => {
      if (!isEqualPath(href, window.location.href, { deep: false })) {
        NProgress.start();
      }
      navigate(href, options);
    },
    [navigate]
  );

  const replace = useCallback(
    (href: string, options?: NavigateOptions) => {
      if (!isEqualPath(href, window.location.href, { deep: false })) {
        NProgress.start();
      }
      navigate(href, { ...options, replace: true });
    },
    [navigate]
  );

  const router = useMemo(
    () => ({
      push,
      replace,
      back: () => navigate(-1),
      forward: () => navigate(1),
      /**
       * FULL DOCUMENT RELOAD — `navigate(0)` is `history.go(0)`, which the HTML
       * spec makes equivalent to `location.reload()`. It discards all SPA
       * state. Do not use it to "re-evaluate guards" after an auth change:
       * the auth context already re-renders them. Navigate instead.
       */
      refresh: () => navigate(0),
      ...navigate,
    }),
    [navigate, push, replace]
  );

  return router;
}
