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
// is what the seeders produce. Only the endpoints the current phases need are
// implemented; later phases extend this file as their flows land.
//
// State is mutable and in-memory: create → pay → detail is walkable without a
// backend. It resets on page reload, which is the right scope for a fixture.
// ----------------------------------------------------------------------

type Envelope<T> = {
  data: T;
  message: string;
  meta: Record<string, unknown> | null;
  errors: null;
};

// ---------------------------------------------------------------- fixtures

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

const LAPAK_SARI = {
  id: '11111111-1111-4111-8111-222222222222',
  user_id: '21111111-1111-4111-8111-222222222222',
  name: 'Bersih Kilat Sari',
  description: 'Jasa bersih-bersih rumah dan kantor.',
  lat: -7.982,
  lng: 112.651,
  rating: 4.9,
  is_available: true,
};

const CUSTOMER = { id: '20000000-0000-4000-8000-000000000000', full_name: 'Budi Santoso' };

type LapakSummary = { id: string; name: string; rating: number };

const lapakSummary = (lapak: typeof LAPAK_JOKO): LapakSummary => ({
  id: lapak.id,
  name: lapak.name,
  rating: lapak.rating,
});

const WALLET = {
  user_id: CUSTOMER.id,
  balance_idr: 5000000,
};

type LedgerRow = {
  id: string;
  type: string;
  amount_idr: number;
  balance_after_idr: number;
  order_id: string | null;
  bid_id: string | null;
  note: string;
  created_at: string;
};

// Signed amounts, newest first — matches the contract's LedgerEntry.
const LEDGER: LedgerRow[] = [
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

const CONFIG_ROW = {
  bid_auto_fee_idr: 2500,
  bid_manual_fee_idr: 10000,
  order_auto_confirm_seconds: 60,
};

const PRODUCTS = [
  {
    id: '41111111-1111-4111-8111-111111111111',
    title: 'Meja kayu jati custom',
    description: 'Meja kerja kayu jati solid, ukuran sesuai permintaan.',
    price_idr: 1500000,
    image_url: null,
    lapak: lapakSummary(LAPAK_JOKO),
  },
  {
    id: '41111111-1111-4111-8111-222222222222',
    title: 'Bersih rumah 1 hari',
    description: 'Pembersihan menyeluruh rumah tipe 36-70, satu hari kerja.',
    price_idr: 250000,
    image_url: null,
    lapak: lapakSummary(LAPAK_SARI),
  },
];

type MockOrderItem = {
  id: string;
  product_id: string | null;
  gig_tier_id: string | null;
  name: string;
  unit_price_idr: number;
  quantity: number;
  subtotal_idr: number;
  status: 'unpaid' | 'paid';
  created_at: string;
};

type MockPayment = {
  id: string;
  order_id: string;
  amount_idr: number;
  order_item_ids: string[];
  paid_at: string;
};

type MockOrder = {
  id: string;
  source: string;
  status: string;
  customer: typeof CUSTOMER;
  lapak: LapakSummary;
  items: MockOrderItem[];
  payments: MockPayment[];
  total_idr: number;
  paid_idr: number;
  outstanding_idr: number;
  bid_id: string | null;
  chat_thread_id: string | null;
  delivery_status: string;
  confirm_deadline_at: string | null;
  auto_confirmed: boolean;
  completed_at: string | null;
  created_at: string;
};

const ORDERS: MockOrder[] = [];

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}${String(seq).padStart(12, '0')}`;
}

type MockMessage = {
  id: string;
  thread_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
};

const THREAD_ID = '61111111-1111-4111-8111-111111111111';

const CHAT_THREADS = [
  {
    id: THREAD_ID,
    order_id: '51111111-1111-4111-8111-111111111111',
    customer: CUSTOMER,
    lapak: lapakSummary(LAPAK_JOKO),
    created_at: '2026-09-01T03:00:00Z',
  },
];

const CHAT_MESSAGES: Record<string, MockMessage[]> = {
  [THREAD_ID]: [
    {
      id: '71111111-1111-4111-8111-111111111111',
      thread_id: THREAD_ID,
      sender_user_id: LAPAK_JOKO.user_id,
      body: 'Halo, ada yang bisa saya bantu?',
      created_at: '2026-09-01T03:01:00Z',
    },
  ],
};

// ---------------------------------------------------------------- helpers

function envelope<T>(data: T, meta: Record<string, unknown> | null = null): Envelope<T> {
  return { data, message: 'OK', meta, errors: null };
}

/** Contract error shape: map<string, string[]>, with `detail` for non-field errors. */
function errorBody(field: string, message: string) {
  return { data: null, message, meta: null, errors: { [field]: [message] } };
}

function notFound() {
  return errorBody('detail', 'Data tidak ditemukan.');
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

function bodyOf<T>(config: InternalAxiosRequestConfig): T {
  try {
    return JSON.parse((config.data as string) || '{}') as T;
  } catch {
    return {} as T;
  }
}

/** Path segment counted from the end: segment(url, 0) is the last one. */
function segment(config: InternalAxiosRequestConfig, fromEnd: number): string {
  const parts = (config.url ?? '').split('?')[0].split('/');
  return parts[parts.length - 1 - fromEnd] ?? '';
}

/**
 * Signed-in persona. `?lapak` on the app URL flips the mock to the lapak side,
 * so both halves of a two-persona flow can be driven without a real backend.
 */
function isLapakSession(): boolean {
  return typeof window !== 'undefined' && window.location.search.includes('lapak');
}

// ---------------------------------------------------------------- routes

type Route = {
  method: string;
  path: RegExp;
  reply: (config: InternalAxiosRequestConfig) => { status: number; body: unknown };
};

const ROUTES: Route[] = [
  // ---- phase 1: identity, config, wallet ----
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

  // ---- phase 2: catalog ----
  {
    method: 'get',
    path: /^\/market\/v1\/products$/,
    reply: (config) => {
      const q = String(((config.params ?? {}) as { q?: string }).q ?? '').toLowerCase();
      const filtered = q ? PRODUCTS.filter((p) => p.title.toLowerCase().includes(q)) : PRODUCTS;
      const { rows, pagination } = paginate(filtered, config);
      return { status: 200, body: envelope(rows, { pagination }) };
    },
  },
  {
    method: 'get',
    path: /^\/market\/v1\/products\/[^/]+$/,
    reply: (config) => {
      const product = PRODUCTS.find((p) => p.id === segment(config, 0));
      if (!product) return { status: 404, body: notFound() };
      return { status: 200, body: envelope(product) };
    },
  },

  // ---- phase 2: orders ----
  {
    method: 'get',
    path: /^\/market\/v1\/orders$/,
    reply: (config) => {
      const { status } = (config.params ?? {}) as { status?: string };
      const filtered = status ? ORDERS.filter((o) => o.status === status) : ORDERS;
      const { rows, pagination } = paginate(filtered, config);
      // counts deliberately ignore the status filter, per the contract
      // (fe-master amendment) — one call drives every tab badge.
      const counts = ORDERS.reduce<Record<string, number>>(
        (acc, order) => ({ ...acc, [order.status]: (acc[order.status] ?? 0) + 1 }),
        { all: ORDERS.length }
      );
      return { status: 200, body: envelope(rows, { pagination, counts }) };
    },
  },
  {
    method: 'post',
    path: /^\/market\/v1\/orders$/,
    reply: (config) => {
      const body = bodyOf<{ product_id?: string; quantity?: number }>(config);
      const product = PRODUCTS.find((p) => p.id === body.product_id);
      if (!product) return { status: 404, body: notFound() };

      const quantity = body.quantity ?? 1;
      const subtotal = product.price_idr * quantity;
      const now = new Date().toISOString();
      const order: MockOrder = {
        id: nextId('5'),
        source: 'product',
        status: 'pending_payment',
        customer: CUSTOMER,
        lapak: product.lapak,
        items: [
          {
            id: nextId('8'),
            product_id: product.id,
            gig_tier_id: null,
            name: product.title,
            unit_price_idr: product.price_idr,
            quantity,
            subtotal_idr: subtotal,
            status: 'unpaid',
            created_at: now,
          },
        ],
        payments: [],
        total_idr: subtotal,
        paid_idr: 0,
        outstanding_idr: subtotal,
        bid_id: null,
        chat_thread_id: null,
        delivery_status: 'none',
        confirm_deadline_at: null,
        auto_confirmed: false,
        completed_at: null,
        created_at: now,
      };
      ORDERS.unshift(order);
      return { status: 201, body: envelope(order) };
    },
  },
  {
    method: 'get',
    path: /^\/market\/v1\/orders\/[^/]+$/,
    reply: (config) => {
      const order = ORDERS.find((o) => o.id === segment(config, 0));
      if (!order) return { status: 404, body: notFound() };
      return { status: 200, body: envelope(order) };
    },
  },
  {
    method: 'post',
    path: /^\/market\/v1\/orders\/[^/]+\/pay$/,
    reply: (config) => {
      const order = ORDERS.find((o) => o.id === segment(config, 1));
      if (!order) return { status: 404, body: notFound() };
      if (order.outstanding_idr === 0) {
        return { status: 400, body: errorBody('detail', 'Tidak ada tagihan tersisa.') };
      }
      // 402 is the contract's insufficient-balance code. Exercised whenever the
      // fixture wallet cannot cover the charge, so FE handles the real branch
      // rather than only the happy path.
      if (order.outstanding_idr > WALLET.balance_idr) {
        return { status: 402, body: errorBody('detail', 'Saldo tidak mencukupi.') };
      }

      const amount = order.outstanding_idr;
      const payment: MockPayment = {
        id: nextId('9'),
        order_id: order.id,
        amount_idr: amount,
        order_item_ids: order.items.filter((i) => i.status === 'unpaid').map((i) => i.id),
        paid_at: new Date().toISOString(),
      };
      order.items.forEach((item) => {
        item.status = 'paid';
      });
      order.payments.push(payment);
      order.paid_idr = order.total_idr;
      order.outstanding_idr = 0;
      order.status = 'paid';

      WALLET.balance_idr -= amount;
      LEDGER.unshift({
        id: nextId('3'),
        type: 'order_payment',
        amount_idr: -amount,
        balance_after_idr: WALLET.balance_idr,
        order_id: order.id,
        bid_id: null,
        note: `Pembayaran ${order.items[0]?.name ?? 'pesanan'}`,
        created_at: new Date().toISOString(),
      });

      return {
        status: 200,
        body: envelope({ order, payment, wallet_balance_idr: WALLET.balance_idr }),
      };
    },
  },

  // `complete` and `confirm` are phase-3 endpoints (FE-C/FE-I own the UI), but
  // they are mocked here from phase 2 because they are the ONLY way to drive an
  // order into `awaiting_confirmation` — without them FE-G's confirm-deadline
  // countdown cannot be exercised in a browser at all. Found by fe-task-g.
  {
    method: 'post',
    path: /^\/market\/v1\/orders\/[^/]+\/complete$/,
    reply: (config) => {
      const order = ORDERS.find((o) => o.id === segment(config, 1));
      if (!order) return { status: 404, body: notFound() };
      if (order.outstanding_idr > 0) {
        return { status: 409, body: errorBody('detail', 'Pesanan masih memiliki tagihan.') };
      }
      order.status = 'awaiting_confirmation';
      // Seeded window is 60s (contract x-seed-data), short on purpose so the
      // auto-confirm path is observable rather than a 24h wait.
      order.confirm_deadline_at = new Date(
        Date.now() + CONFIG_ROW.order_auto_confirm_seconds * 1000
      ).toISOString();
      return { status: 200, body: envelope(order) };
    },
  },
  {
    method: 'post',
    path: /^\/market\/v1\/orders\/[^/]+\/confirm$/,
    reply: (config) => {
      const order = ORDERS.find((o) => o.id === segment(config, 1));
      if (!order) return { status: 404, body: notFound() };
      if (order.status === 'completed') {
        // Idempotent against the sweeper, exactly as the contract specifies:
        // if the window elapsed first the order is already completed, and this
        // returns it rather than paying the lapak twice.
        return { status: 200, body: envelope(order) };
      }
      if (order.status !== 'awaiting_confirmation') {
        return { status: 409, body: errorBody('detail', 'Pesanan belum selesai dikerjakan.') };
      }
      order.status = 'completed';
      order.completed_at = new Date().toISOString();
      order.confirm_deadline_at = null;
      order.auto_confirmed = false;
      return { status: 200, body: envelope(order) };
    },
  },

  // ---- phase 2: chat (REST half only — SSE is not mocked, see below) ----
  {
    method: 'get',
    path: /^\/market\/v1\/chat\/threads$/,
    reply: (config) => {
      const withLast = CHAT_THREADS.map((thread) => ({
        ...thread,
        // `.at()` needs es2022; this tsconfig targets lower.
        last_message: (() => {
          const rows = CHAT_MESSAGES[thread.id] ?? [];
          return rows.length ? rows[rows.length - 1] : null;
        })(),
      }));
      const { rows, pagination } = paginate(withLast, config);
      return { status: 200, body: envelope(rows, { pagination }) };
    },
  },
  {
    method: 'get',
    path: /^\/market\/v1\/chat\/threads\/[^/]+\/messages$/,
    reply: (config) => {
      const threadId = segment(config, 1);
      const messages = [...(CHAT_MESSAGES[threadId] ?? [])].reverse(); // newest first
      const { rows, pagination } = paginate(messages, config);
      return { status: 200, body: envelope(rows, { pagination }) };
    },
  },
  {
    method: 'post',
    path: /^\/market\/v1\/chat\/threads\/[^/]+\/messages$/,
    reply: (config) => {
      const threadId = segment(config, 1);
      const body = bodyOf<{ body?: string }>(config);
      if (!body.body?.trim()) {
        return { status: 422, body: errorBody('body', 'Pesan tidak boleh kosong.') };
      }
      const message: MockMessage = {
        id: nextId('7'),
        thread_id: threadId,
        sender_user_id: isLapakSession() ? LAPAK_JOKO.user_id : CUSTOMER.id,
        body: body.body,
        created_at: new Date().toISOString(),
      };
      CHAT_MESSAGES[threadId] = [...(CHAT_MESSAGES[threadId] ?? []), message];
      return { status: 201, body: envelope(message) };
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
 *
 * **SSE is deliberately not mocked.** `GET /chat/threads/{id}/stream` is
 * consumed by `EventSource`, which never goes through axios, so an axios
 * adapter cannot intercept it. Faking it would mean shimming a global browser
 * API — a lot of machinery whose only purpose is to test our own fake. The REST
 * half of chat (thread list, history, send) is mocked and is enough to build
 * the UI; live delivery is verified against the real backend at phase QA, which
 * is the only place it can be verified honestly anyway.
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
      statusText: status < 400 ? 'OK' : 'Error',
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
