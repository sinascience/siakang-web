import type { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/shared/config';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
    _skipAuthRefresh?: boolean;
  }
}

type RetriableConfig = InternalAxiosRequestConfig;

type RefreshHandler = (
  refreshToken: string
) => Promise<{ access_token: string; refresh_token: string }>;
type UnauthorizedHandler = () => void;

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl,
  headers: { 'Content-Type': 'application/json' },
});

// Dev-only: answer /market/v1/* from the in-repo fixtures instead of the
// backend. Off in committed code; QA always runs with mocks OFF.
//
// Imported DYNAMICALLY behind `import.meta.env.DEV` on purpose. It used to be
// a static import, which put the entire fixture set — seeded logins, lapak
// names, coordinates, the fake API — into the production bundle even with the
// runtime flag off. In a production build `import.meta.env.DEV` is false, so
// this branch and the module it references are eliminated and cannot ship.
if (import.meta.env.DEV && CONFIG.useMocks) {
  void import('./market-mock').then(({ installMarketMock }) => {
    installMarketMock(axiosInstance);
  });
}

let getAccessTokenFn: () => string | null = () => null;
let getRefreshTokenFn: () => string | null = () => null;
let refreshHandler: RefreshHandler | null = null;
let onUnauthorized: UnauthorizedHandler | null = null;

let refreshPromise: Promise<string> | null = null;

export function configureAxiosAuth(opts: {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onRefresh: RefreshHandler;
  onUnauthorized: UnauthorizedHandler;
}) {
  getAccessTokenFn = opts.getAccessToken;
  getRefreshTokenFn = opts.getRefreshToken;
  refreshHandler = opts.onRefresh;
  onUnauthorized = opts.onUnauthorized;
}

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessTokenFn();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !original._skipAuthRefresh) {
      const refreshToken = getRefreshTokenFn();
      if (!refreshToken || !refreshHandler) {
        onUnauthorized?.();
        return Promise.reject(normalizeError(error));
      }

      original._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshHandler(refreshToken)
            .then((tokens) => tokens.access_token)
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newAccessToken = await refreshPromise;
        if (!original.headers) {
          original.headers = {} as InternalAxiosRequestConfig['headers'];
        }
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(original);
      } catch (refreshError) {
        onUnauthorized?.();
        return Promise.reject(normalizeError(refreshError));
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

/**
 * Envelope error shape. `core/v1/*` (the skeleton) sends a plain string; the
 * SIAKANG `market/v1/*` contract pins `map<string, string[]>` — field name to
 * messages, with the reserved key `detail` for non-field errors. Both are
 * accepted here so one interceptor serves both API halves.
 */
export type ApiFieldErrors = Record<string, string[]>;

/** Flatten the error map to one human string: `detail` wins, else the first field's first message. */
export function flattenFieldErrors(errors: ApiFieldErrors): string | undefined {
  const detail = errors.detail?.[0];
  if (detail) return detail;
  return Object.values(errors).flat().find(Boolean);
}

function normalizeError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as
      | { message?: string; errors?: string | ApiFieldErrors | null }
      | undefined;

    const raw = payload?.errors;
    const fieldErrors = raw && typeof raw === 'object' ? (raw as ApiFieldErrors) : undefined;

    const detail =
      (typeof raw === 'string' ? raw : fieldErrors && flattenFieldErrors(fieldErrors)) ||
      payload?.message ||
      error.message ||
      'Something went wrong!';

    const wrapped = new Error(detail) as Error & {
      status?: number;
      fieldErrors?: ApiFieldErrors;
    };
    wrapped.status = error.response?.status;
    // Forms map this onto react-hook-form field errors; toasts/ErrorDialog use `.message`.
    if (fieldErrors) wrapped.fieldErrors = fieldErrors;
    return wrapped;
  }
  if (error instanceof Error) return error;
  return new Error('Something went wrong!');
}

export default axiosInstance;

export const fetcher = async <T = unknown>(
  args: string | [string, AxiosRequestConfig]
): Promise<T> => {
  const [url, config] = Array.isArray(args) ? args : [args, {}];
  const res = await axiosInstance.get<T>(url, config);
  return res.data;
};

export function withoutAuthRefresh(config: AxiosRequestConfig = {}): AxiosRequestConfig {
  return { ...config, _skipAuthRefresh: true };
}

export const endpoints = {
  auth: {
    signIn: '/core/v1/auth/signin',
    signUp: '/core/v1/auth/signup',
    google: '/core/v1/auth/google',
    refresh: '/core/v1/auth/refresh',
    logout: '/core/v1/auth/logout',
    logoutAll: '/core/v1/auth/logout-all',
    switchCompany: '/core/v1/auth/switch-company',
    me: '/core/v1/auth/me',
    companies: '/core/v1/auth/companies',
  },
  core: {
    companies: {
      list: '/core/v1/companies',
      byId: (id: string) => `/core/v1/companies/${id}`,
    },
    branches: {
      list: '/core/v1/branches',
      byCompanies: '/core/v1/branches/by-companies',
      byId: (id: string) => `/core/v1/branches/${id}`,
    },
    roles: {
      list: '/core/v1/roles',
      byId: (id: string) => `/core/v1/roles/${id}`,
      permissions: (id: string) => `/core/v1/roles/${id}/permissions`,
    },
    users: {
      list: '/core/v1/users',
      byId: (id: string) => `/core/v1/users/${id}`,
      branches: (id: string) => `/core/v1/users/${id}/branches`,
      companies: (id: string) => `/core/v1/users/${id}/companies`,
    },
    auditLogs: {
      root: '/core/v1/audit-logs',
    },
    translationOverrides: {
      base: (clientId: string) => `/core/v1/admin/clients/${clientId}/translation-overrides`,
      byKey: (clientId: string, key: string) =>
        `/core/v1/admin/clients/${clientId}/translation-overrides/${encodeURIComponent(key)}`,
      public: '/core/v1/translation-overrides',
    },
  },
  // --------------------------------------------------------------------------
  // SIAKANG marketplace — contract/api-v1.yaml v1, dual-signed 2026-09-02.
  // Not company-scoped: /market/v1/* runs JWTAuth() only, so no switch-company
  // step exists in any marketplace flow.
  // --------------------------------------------------------------------------
  market: {
    me: '/market/v1/me',
    config: '/market/v1/config',
    wallet: {
      root: '/market/v1/wallet',
      ledger: '/market/v1/wallet/ledger',
    },
    products: {
      list: '/market/v1/products',
      byId: (id: string) => `/market/v1/products/${id}`,
    },
    gigs: {
      list: '/market/v1/gigs',
      byId: (id: string) => `/market/v1/gigs/${id}`,
    },
    orders: {
      list: '/market/v1/orders',
      byId: (id: string) => `/market/v1/orders/${id}`,
      pay: (id: string) => `/market/v1/orders/${id}/pay`,
      items: (id: string) => `/market/v1/orders/${id}/items`,
      complete: (id: string) => `/market/v1/orders/${id}/complete`,
      confirm: (id: string) => `/market/v1/orders/${id}/confirm`,
    },
    bidCategories: '/market/v1/bid-categories',
    bids: {
      list: '/market/v1/bids',
      byId: (id: string) => `/market/v1/bids/${id}`,
      confirm: (id: string) => `/market/v1/bids/${id}/confirm`,
      accept: (id: string) => `/market/v1/bids/${id}/accept`,
      offers: (id: string) => `/market/v1/bids/${id}/offers`,
      award: (id: string, offerId: string) => `/market/v1/bids/${id}/offers/${offerId}/award`,
    },
    chat: {
      threads: '/market/v1/chat/threads',
      messages: (threadId: string) => `/market/v1/chat/threads/${threadId}/messages`,
      // EventSource cannot send an Authorization header, so the access token
      // travels as a query param (documented contract tradeoff, v2 moves to a
      // ticket endpoint). Build the absolute URL — EventSource ignores the
      // axios baseURL.
      stream: (threadId: string, token: string) =>
        `${CONFIG.serverUrl}/market/v1/chat/threads/${threadId}/stream?token=${encodeURIComponent(token)}`,
    },
  },
} as const;
