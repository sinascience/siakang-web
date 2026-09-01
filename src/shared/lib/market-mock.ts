import type { AxiosAdapter, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// ----------------------------------------------------------------------
// Dev-only mock for `/market/v1/*`, so FE builds against the frozen contract
// without waiting on BE (SPEC §4). Gated by CONFIG.useMocks (VITE_USE_MOCKS),
// which is off in committed code — QA always runs with mocks OFF.
//
// Mocks live ONLY in this file. Feature code calls `endpoints.market.*` through
// the shared axios instance and knows nothing about mocks, which is what keeps
// `docs/CONVENTIONS.md`'s "no mock data in features" rule literally true.
// Product approved this shape on 2026-09-02; the file is deleted at sprint
// integration, or per-flow as each real endpoint starts passing against it.
//
// Fixtures mirror `contract/api-v1.yaml`'s `x-seed-data`, so what you see here
// is what the seeders produce. Only the endpoints phase 1 actually has are
// implemented; later phases extend this file as their flows land.
// ----------------------------------------------------------------------

type Envelope<T> = {
  data: T;
  message: string;
  meta: Record<string, unknown> | null;
  errors: null;
};

const LAPAK_JOKO = {
  id: '11111111-1111-4111-8111-111111111111',
  user_id: '21111111-1111-4111-8111-111111111111',
  name: 'Servis Elektronik Pak Joko',
  description: 'Servis kulkas, freezer, dan elektronik rumah tangga.',
  lat: -7.9666,
  lng: 112.6326,
  rating: 4.8,
  is_available: true,
};

// Signed amounts, newest first — matches the contract's LedgerEntry.
const LEDGER = [
  {
    id: '31111111-1111-4111-8111-111111111111',
    type: 'topup',
    amount_idr: 5000000,
    balance_after_idr: 5000000,
    order_id: null,
    bid_id: null,
    note: 'Saldo awal (seed)',
    created_at: '2026-09-01T02:00:00Z',
  },
];

const WALLET = {
  user_id: '20000000-0000-4000-8000-000000000000',
  balance_idr: 5000000,
};

const CONFIG_ROW = {
  bid_auto_fee_idr: 2500,
  bid_manual_fee_idr: 10000,
  order_auto_confirm_seconds: 60,
};

function envelope<T>(data: T, meta: Record<string, unknown> | null = null): Envelope<T> {
  return { data, message: 'OK', meta, errors: null };
}

function paginate<T>(rows: T[], config: InternalAxiosRequestConfig) {
  const params = (config.params ?? {}) as { page?: number; limit?: number };
  const page = Number(params.page ?? 1);
  const limit = Number(params.limit ?? 25);
  const start = (page - 1) * limit;
  return {
    rows: rows.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: rows.length,
      total_pages: Math.max(1, Math.ceil(rows.length / limit)),
    },
  };
}

/**
 * Signed-in persona. `?lapak` on the app URL flips the mock to the lapak side,
 * so both halves of a two-persona flow can be driven without a real backend.
 */
function isLapakSession(): boolean {
  return typeof window !== 'undefined' && window.location.search.includes('lapak');
}

type Route = {
  method: string;
  path: RegExp;
  reply: (config: InternalAxiosRequestConfig) => { status: number; body: unknown };
};

const ROUTES: Route[] = [
  {
    method: 'get',
    path: /^\/market\/v1\/me$/,
    reply: () => ({
      status: 200,
      body: envelope({ lapak: isLapakSession() ? LAPAK_JOKO : null }),
    }),
  },
  {
    method: 'get',
    path: /^\/market\/v1\/config$/,
    reply: () => ({ status: 200, body: envelope(CONFIG_ROW) }),
  },
  {
    method: 'get',
    path: /^\/market\/v1\/wallet$/,
    reply: () => ({ status: 200, body: envelope(WALLET) }),
  },
  {
    method: 'get',
    path: /^\/market\/v1\/wallet\/ledger$/,
    reply: (config) => {
      const { rows, pagination } = paginate(LEDGER, config);
      return { status: 200, body: envelope(rows, { pagination }) };
    },
  },
];

function findRoute(config: InternalAxiosRequestConfig): Route | undefined {
  const url = (config.url ?? '').split('?')[0];
  const method = (config.method ?? 'get').toLowerCase();
  return ROUTES.find((route) => route.method === method && route.path.test(url));
}

/**
 * Swap in an adapter that answers the mocked market routes and delegates
 * everything else (all of `/core/v1/*` included) to the real one.
 */
export function installMarketMock(instance: AxiosInstance): void {
  const realAdapter = instance.defaults.adapter as AxiosAdapter;

  instance.defaults.adapter = async (config) => {
    const route = findRoute(config);
    if (!route) return realAdapter(config);

    const { status, body } = route.reply(config);
    const response: AxiosResponse = {
      data: body,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: {},
      config,
    };

    // Mirror axios' own contract: non-2xx must reject, or error handling here
    // would diverge from the real backend the moment a mock returns 4xx.
    if (status >= 400) {
      return Promise.reject(
        Object.assign(new Error(`Request failed with status code ${status}`), {
          isAxiosError: true,
          response,
          config,
        })
      );
    }
    return response;
  };
}
