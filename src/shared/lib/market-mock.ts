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

const LAPAK_AGUS = {
  id: '11111111-1111-4111-8111-333333333333',
  user_id: '21111111-1111-4111-8111-333333333333',
  name: 'Tukang Kebun Agus',
  description: 'Perawatan taman dan kebun.',
  // Nearest of the three to the customer's seeded coordinates, and the best
  // rated — and unavailable. Exists so "unavailable lapaks are never proposed"
  // is provable rather than vacuous.
  lat: -7.967,
  lng: 112.633,
  rating: 5.0,
  is_available: false,
};

const CUSTOMER = { id: '20000000-0000-4000-8000-000000000000', full_name: 'Budi Santoso' };

type LapakSummary = { id: string; name: string; rating: number };

const lapakSummary = (lapak: typeof LAPAK_JOKO): LapakSummary => ({
  id: lapak.id,
  name: lapak.name,
  rating: lapak.rating,
});

// ---------------------------------------------------------------- accounts
//
// `/core/v1/auth/*` is mocked too, so a minor signs in through the real
// sign-in page and the persona follows from the account — no URL flag, no
// faked auth context, no temporary edit to a hot file to wire one in. This is
// the single supported way to be a persona under mocks.
//
// Mirrors the contract's `x-seed-data`. Password for every account, as seeded:
// `siakang123`.

type SeededAccount = {
  login: string;
  user: { id: string; email: string; username: string; full_name: string };
  roles: string[];
  /** The lapak profile `GET /market/v1/me` returns; null for a customer. */
  lapak: typeof LAPAK_JOKO | null;
  balance_idr: number;
};

const SEEDED_ACCOUNTS: SeededAccount[] = [
  {
    login: 'budi@siakang.test',
    user: {
      id: '20000000-0000-4000-8000-000000000000',
      email: 'budi@siakang.test',
      username: 'budi',
      full_name: 'Budi Santoso',
    },
    roles: ['customer'],
    lapak: null,
    balance_idr: 5000000,
  },
  {
    login: 'siti@siakang.test',
    user: {
      id: '20000000-0000-4000-8000-000000000001',
      email: 'siti@siakang.test',
      username: 'siti',
      full_name: 'Siti Rahayu',
    },
    roles: ['customer'],
    lapak: null,
    // Contract v1.0.4: under every catalogue price, so purchases refuse — but
    // she can pay the 2 500 / 10 000 platform fees, which is the point of her.
    balance_idr: 100000,
  },
  {
    login: 'joko@siakang.test',
    user: {
      id: LAPAK_JOKO.user_id,
      email: 'joko@siakang.test',
      username: 'joko',
      full_name: 'Joko Susilo',
    },
    roles: ['lapak'],
    lapak: LAPAK_JOKO,
    balance_idr: 0,
  },
  {
    login: 'sari@siakang.test',
    user: {
      id: LAPAK_SARI.user_id,
      email: 'sari@siakang.test',
      username: 'sari',
      full_name: 'Sari Wulandari',
    },
    roles: ['lapak'],
    lapak: LAPAK_SARI,
    balance_idr: 0,
  },
];

const SEEDED_PASSWORD = 'siakang123';

function base64url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * A structurally real JWT — unsigned, but the FE never verifies the signature.
 * It must decode, because `isAccessTokenExpired` reads `exp` via `jwtDecode`,
 * and it carries the login so the session survives a page reload: the token in
 * sessionStorage is the only thing left after one.
 */
function makeToken(login: string, ttlSeconds: number): string {
  const header = base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({ sub: login, email: login, exp: Math.floor(Date.now() / 1000) + ttlSeconds })
  );
  return `${header}.${payload}.mock`;
}

function accountFromToken(token: string | undefined): SeededAccount | undefined {
  if (!token) return undefined;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      sub?: string;
    };
    return SEEDED_ACCOUNTS.find((a) => a.login === payload.sub);
  } catch {
    return undefined;
  }
}

/** Who is calling, from the Authorization header the axios interceptor attached. */
function caller(config: InternalAxiosRequestConfig): SeededAccount | undefined {
  const raw = config.headers?.Authorization ?? config.headers?.authorization;
  const header = typeof raw === 'string' ? raw : undefined;
  return accountFromToken(header?.replace(/^Bearer\s+/i, ''));
}

/** One wallet per seeded account, so Siti's small balance is actually hers. */
const WALLETS: Record<string, { user_id: string; balance_idr: number }> = Object.fromEntries(
  SEEDED_ACCOUNTS.map((a) => [a.login, { user_id: a.user.id, balance_idr: a.balance_idr }])
);

function walletOf(config: InternalAxiosRequestConfig) {
  const account = caller(config);
  return account ? WALLETS[account.login] : undefined;
}

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
// One ledger per account; a seeded opening balance only where there is one.
const LEDGERS: Record<string, LedgerRow[]> = Object.fromEntries(
  SEEDED_ACCOUNTS.map((a) => [
    a.login,
    a.balance_idr > 0
      ? [
          {
            id: `3${a.user.id.slice(-11)}`,
            type: 'topup',
            amount_idr: a.balance_idr,
            balance_after_idr: a.balance_idr,
            order_id: null,
            bid_id: null,
            note: 'Saldo awal (seed)',
            created_at: '2026-09-01T02:00:00Z',
          },
        ]
      : [],
  ])
);

function ledgerOf(config: InternalAxiosRequestConfig): LedgerRow[] {
  const account = caller(config);
  return account ? LEDGERS[account.login] : [];
}

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

const GIGS = [
  {
    id: '42111111-1111-4111-8111-111111111111',
    title: 'Servis kulkas & freezer',
    description: 'Diagnosa dan perbaikan kulkas atau freezer rumah tangga.',
    image_url: null,
    lapak: lapakSummary(LAPAK_JOKO),
    // Ordered by price ascending, per the contract. goal.md's worked example.
    tiers: [
      {
        id: '43111111-1111-4111-8111-111111111111',
        gig_id: '42111111-1111-4111-8111-111111111111',
        name: 'Konsultasi',
        description: 'Diagnosa awal lewat chat.',
        price_idr: 10000,
      },
      {
        id: '43111111-1111-4111-8111-222222222222',
        gig_id: '42111111-1111-4111-8111-111111111111',
        name: 'Perbaikan ringan',
        description: 'Penggantian komponen kecil.',
        price_idr: 20000,
      },
      {
        id: '43111111-1111-4111-8111-333333333333',
        gig_id: '42111111-1111-4111-8111-111111111111',
        name: 'Perbaikan besar',
        description: 'Perbaikan kompresor atau sistem pendingin.',
        price_idr: 150000,
      },
    ],
  },
];

const ALL_TIERS = GIGS.flatMap((gig) => gig.tiers);

type MockOrderItem = {
  id: string;
  product_id: string | null;
  gig_tier_id: string | null;
  gig_id: string | null;
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

// ---------------------------------------------------------------- bids

const BID_CATEGORIES = [
  { id: '44111111-1111-4111-8111-111111111111', name: 'Bersih-bersih rumah', slug: 'cleaning' },
  { id: '44111111-1111-4111-8111-222222222222', name: 'Perawatan taman', slug: 'gardening' },
];

/** Every seeded lapak takes work in any seeded category in sprint 1. */
const BID_LAPAKS = [LAPAK_JOKO, LAPAK_SARI, LAPAK_AGUS];

type MockOffer = {
  id: string;
  bid_id: string;
  lapak: LapakSummary;
  amount_idr: number;
  message: string | null;
  status: 'pending' | 'awarded' | 'rejected';
  created_at: string;
};

type MockBid = {
  id: string;
  mode: 'auto' | 'manual';
  status: string;
  category: (typeof BID_CATEGORIES)[number];
  customer: typeof CUSTOMER;
  title: string;
  description: string | null;
  budget_idr: number;
  lat: number;
  lng: number;
  fee_paid_idr: number;
  matched_lapak: LapakSummary | null;
  matched_distance_km: number | null;
  offer_count: number;
  accepted_offer_id: string | null;
  order_id: string | null;
  off_platform_risk: boolean;
  created_at: string;
};

const BIDS: MockBid[] = [];
const OFFERS: MockOffer[] = [];

/** Haversine, in km — the same rule the backend applies over seeded lat/lng. */
function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Nearest available lapak wins; rating breaks a distance tie. Deliberately NOT
 * rating-first: with the seeded set that distinction is the whole of criterion
 * 4 — joko is nearest, sari is rated higher and must still lose, and agus is
 * nearest AND best-rated but unavailable, so he must never be proposed.
 */
function matchLapak(lat: number, lng: number) {
  const candidates = BID_LAPAKS.filter((l) => l.is_available)
    .map((l) => ({ lapak: l, km: distanceKm(lat, lng, l.lat, l.lng) }))
    .sort((a, b) => a.km - b.km || b.lapak.rating - a.lapak.rating);
  return candidates[0];
}

/** The contract's `Bid` shape — the mock stores nothing extra, so this is identity. */
function bidView(bid: MockBid): MockBid {
  return bid;
}

// ---------------------------------------------------------------- helpers

function envelope<T>(data: T, meta: Record<string, unknown> | null = null): Envelope<T> {
  return { data, message: 'OK', meta, errors: null };
}

/** Contract error shape: map<string, string[]>, with `detail` for non-field errors. */
function errorBody(field: string, message: string) {
  return { data: null, message, meta: null, errors: { [field]: [message] } };
}

function unauthorized() {
  return errorBody('detail', 'Token tidak valid atau sudah kedaluwarsa.');
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
 * `MeResponse`. `company` and `client` are absent, not null — marketplace
 * personas have no company by design, and the real API omits the keys, so the
 * mock must omit them too or FE stops exercising the null-tolerant path.
 */
function meFor(account: SeededAccount) {
  return {
    user: account.user,
    roles: account.roles,
    permissions: [] as string[],
    is_super_admin: false,
  };
}

/** `SignInResult` — a token pair plus the same `me` payload. */
function sessionFor(account: SeededAccount) {
  return {
    access_token: makeToken(account.login, 60 * 60),
    refresh_token: makeToken(account.login, 60 * 60 * 24 * 7),
    token_type: 'Bearer',
    expires_in: 3600,
    ...meFor(account),
  };
}

/** The customer's seeded coordinates — matching origin when a bid omits them. */
const CUSTOMER_LAT = -7.97;
const CUSTOMER_LNG = 112.63;

/**
 * A bid that reached agreement produces a tracked order, `pending_payment`,
 * with a chat thread for the pair — the thread opens here rather than at first
 * payment, per contract v1.0.2's "whichever happens first".
 */
function createBidOrder(
  bid: MockBid,
  lapak: LapakSummary,
  amountIdr: number,
  source: 'bid_auto' | 'bid_manual'
): MockOrder {
  const now = new Date().toISOString();
  const order: MockOrder = {
    id: nextId('5'),
    source,
    status: 'pending_payment',
    customer: bid.customer,
    lapak,
    items: [
      {
        id: nextId('8'),
        product_id: null,
        gig_tier_id: null,
        gig_id: null,
        name: bid.title,
        unit_price_idr: amountIdr,
        quantity: 1,
        subtotal_idr: amountIdr,
        status: 'unpaid',
        created_at: now,
      },
    ],
    payments: [],
    total_idr: amountIdr,
    paid_idr: 0,
    outstanding_idr: amountIdr,
    bid_id: bid.id,
    chat_thread_id: null,
    delivery_status: 'none',
    confirm_deadline_at: null,
    auto_confirmed: false,
    completed_at: null,
    created_at: now,
  };
  const thread = {
    id: nextId('6'),
    order_id: order.id,
    customer: bid.customer,
    lapak,
    created_at: now,
  };
  CHAT_THREADS.unshift(thread);
  CHAT_MESSAGES[thread.id] = [];
  order.chat_thread_id = thread.id;
  ORDERS.unshift(order);
  return order;
}

// ---------------------------------------------------------------- persistence
//
// The fixture used to live only in module memory, so any document load reset
// it. That was survivable until the app's logout turned out to hard-reload
// (FE-FIX-2): a dual-persona walk — the ONLY way to exercise flows B and C —
// silently started over halfway through, and looked like a broken feature
// rather than a lost fixture.
//
// Logout no longer reloads, but persisting is still the right belt: a stray
// refresh, an HMR full-reload, or a guard redirect should not destroy an
// hour of test state. sessionStorage, not localStorage, so the fixture dies
// with the tab and each run starts from the seed unless you deliberately keep
// the tab open.

const STORE_KEY = 'siakang.mock.state.v1';

type Snapshot = {
  seq: number;
  orders: MockOrder[];
  bids: MockBid[];
  offers: MockOffer[];
  threads: typeof CHAT_THREADS;
  messages: Record<string, MockMessage[]>;
  wallets: Record<string, { user_id: string; balance_idr: number }>;
  ledgers: Record<string, LedgerRow[]>;
};

/** Replace an array's contents in place — the bindings are `const` by design. */
function refill<T>(target: T[], next: T[]): void {
  target.splice(0, target.length, ...next);
}

/** Replace a record's contents in place. */
function rekey<T>(target: Record<string, T>, next: Record<string, T>): void {
  Object.keys(target).forEach((k) => delete target[k]);
  Object.assign(target, next);
}

function persist(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const snapshot: Snapshot = {
      seq,
      orders: ORDERS,
      bids: BIDS,
      offers: OFFERS,
      threads: CHAT_THREADS,
      messages: CHAT_MESSAGES,
      wallets: WALLETS,
      ledgers: LEDGERS,
    };
    sessionStorage.setItem(STORE_KEY, JSON.stringify(snapshot));
  } catch {
    // Quota or a private-mode restriction. A fixture that cannot persist is
    // worth far less than one that throws mid-request.
  }
}

function hydrate(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return;
    const snapshot = JSON.parse(raw) as Snapshot;
    seq = snapshot.seq ?? 0;
    refill(ORDERS, snapshot.orders ?? []);
    refill(BIDS, snapshot.bids ?? []);
    refill(OFFERS, snapshot.offers ?? []);
    refill(CHAT_THREADS, snapshot.threads ?? []);
    rekey(CHAT_MESSAGES, snapshot.messages ?? {});
    if (snapshot.wallets) rekey(WALLETS, snapshot.wallets);
    if (snapshot.ledgers) rekey(LEDGERS, snapshot.ledgers);
  } catch {
    // A corrupt or stale-shaped snapshot must not brick the app: fall back to
    // the seeded fixture, which is exactly what a fresh tab would give.
  }
}

/** Drop the persisted fixture and start from the seed on the next load. */
export function resetMarketMockState(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(STORE_KEY);
}

// ---------------------------------------------------------------- routes

type Route = {
  method: string;
  path: RegExp;
  reply: (config: InternalAxiosRequestConfig) => { status: number; body: unknown };
};

const ROUTES: Route[] = [
  // ---- core auth, so the real sign-in page works under mocks ----
  //
  // This is what removes the need for a faked auth context: `AuthGuard` cannot
  // be satisfied while `/core/v1/auth/*` reaches a backend that is not running,
  // and three minors each invented a different way around it. Now they sign in.
  {
    method: 'post',
    path: /^\/core\/v1\/auth\/signin$/,
    reply: (config) => {
      const body = bodyOf<{ login?: string; password?: string }>(config);
      const account = SEEDED_ACCOUNTS.find((a) => a.login === body.login);
      if (!account || body.password !== SEEDED_PASSWORD) {
        return { status: 401, body: errorBody('detail', 'Email atau kata sandi salah.') };
      }
      return { status: 200, body: envelope(sessionFor(account)) };
    },
  },
  {
    method: 'post',
    path: /^\/core\/v1\/auth\/refresh$/,
    reply: (config) => {
      const body = bodyOf<{ refresh_token?: string }>(config);
      const account = accountFromToken(body.refresh_token);
      if (!account) return { status: 401, body: unauthorized() };
      return { status: 200, body: envelope(sessionFor(account)) };
    },
  },
  {
    method: 'get',
    path: /^\/core\/v1\/auth\/me$/,
    reply: (config) => {
      const account = caller(config);
      if (!account) return { status: 401, body: unauthorized() };
      return { status: 200, body: envelope(meFor(account)) };
    },
  },
  {
    method: 'post',
    path: /^\/core\/v1\/auth\/logout(-all)?$/,
    reply: () => ({ status: 200, body: envelope({ message: 'ok' }) }),
  },

  // ---- phase 1: identity, config, wallet ----
  {
    method: 'get',
    path: /^\/market\/v1\/me$/,
    reply: (config) => {
      const account = caller(config);
      if (!account) return { status: 401, body: unauthorized() };
      return { status: 200, body: envelope({ lapak: account.lapak }) };
    },
  },
  {
    method: 'get',
    path: /^\/market\/v1\/config$/,
    reply: () => ({ status: 200, body: envelope(CONFIG_ROW) }),
  },
  {
    method: 'get',
    path: /^\/market\/v1\/wallet$/,
    reply: (config) => {
      const wallet = walletOf(config);
      if (!wallet) return { status: 401, body: unauthorized() };
      return { status: 200, body: envelope(wallet) };
    },
  },
  {
    method: 'get',
    path: /^\/market\/v1\/wallet\/ledger$/,
    reply: (config) => {
      const { rows, pagination } = paginate(ledgerOf(config), config);
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

  // ---- phase 3: gigs ----
  {
    method: 'get',
    path: /^\/market\/v1\/gigs$/,
    reply: (config) => {
      const q = String(((config.params ?? {}) as { q?: string }).q ?? '').toLowerCase();
      const filtered = q ? GIGS.filter((g) => g.title.toLowerCase().includes(q)) : GIGS;
      const { rows, pagination } = paginate(filtered, config);
      return { status: 200, body: envelope(rows, { pagination }) };
    },
  },
  {
    method: 'get',
    path: /^\/market\/v1\/gigs\/[^/]+$/,
    reply: (config) => {
      const gig = GIGS.find((g) => g.id === segment(config, 0));
      if (!gig) return { status: 404, body: notFound() };
      return { status: 200, body: envelope(gig) };
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
      const body = bodyOf<{ product_id?: string; gig_tier_id?: string; quantity?: number }>(config);

      // Exactly one of product_id / gig_tier_id, per CreateOrderRequest.
      const product = body.product_id ? PRODUCTS.find((p) => p.id === body.product_id) : undefined;
      const tier = body.gig_tier_id ? ALL_TIERS.find((t) => t.id === body.gig_tier_id) : undefined;
      if (!product && !tier) return { status: 404, body: notFound() };

      const gig = tier ? GIGS.find((g) => g.id === tier.gig_id) : undefined;
      const quantity = product ? (body.quantity ?? 1) : 1;
      const unitPrice = product ? product.price_idr : tier!.price_idr;
      const subtotal = unitPrice * quantity;
      const now = new Date().toISOString();
      const order: MockOrder = {
        id: nextId('5'),
        source: product ? 'product' : 'gig',
        status: 'pending_payment',
        customer: CUSTOMER,
        lapak: product ? product.lapak : gig!.lapak,
        items: [
          {
            id: nextId('8'),
            product_id: product?.id ?? null,
            gig_tier_id: tier?.id ?? null,
            gig_id: gig?.id ?? null,
            name: product ? product.title : `${gig!.title} — ${tier!.name}`,
            unit_price_idr: unitPrice,
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
      const wallet = walletOf(config);
      if (!wallet) return { status: 401, body: unauthorized() };
      if (order.outstanding_idr > wallet.balance_idr) {
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

      // Contract amendment 2026-09-02 (dual-signed): a thread opens when an
      // order is first paid, whatever its source — not only for gig orders.
      // `whichever happens first` is why this is conditional: a bid order
      // already has its thread from when the bid produced it, and one order
      // must never end up with two.
      if (!order.chat_thread_id) {
        const thread = {
          id: nextId('6'),
          order_id: order.id,
          customer: CUSTOMER,
          lapak: order.lapak,
          created_at: new Date().toISOString(),
        };
        CHAT_THREADS.unshift(thread);
        CHAT_MESSAGES[thread.id] = [];
        order.chat_thread_id = thread.id;
      }

      wallet.balance_idr -= amount;
      ledgerOf(config).unshift({
        id: nextId('3'),
        type: 'order_payment',
        amount_idr: -amount,
        balance_after_idr: wallet.balance_idr,
        order_id: order.id,
        bid_id: null,
        note: `Pembayaran ${order.items[0]?.name ?? 'pesanan'}`,
        created_at: new Date().toISOString(),
      });

      return {
        status: 200,
        body: envelope({ order, payment, wallet_balance_idr: wallet.balance_idr }),
      };
    },
  },

  {
    method: 'post',
    path: /^\/market\/v1\/orders\/[^/]+\/items$/,
    reply: (config) => {
      const order = ORDERS.find((o) => o.id === segment(config, 1));
      if (!order) return { status: 404, body: notFound() };
      const body = bodyOf<{ gig_tier_id?: string }>(config);
      const tier = ALL_TIERS.find((t) => t.id === body.gig_tier_id);
      if (!tier) return { status: 404, body: notFound() };
      if (order.status === 'completed' || order.status === 'cancelled') {
        return { status: 409, body: errorBody('detail', 'Pesanan sudah selesai.') };
      }

      const gig = GIGS.find((g) => g.id === tier.gig_id);
      // The upsell adds a SECOND item to the SAME order, so paying again
      // produces a second payment row against one order id — goal.md
      // criterion 3 as a data fact rather than a special case.
      order.items.push({
        id: nextId('8'),
        product_id: null,
        gig_tier_id: tier.id,
        gig_id: gig?.id ?? null,
        name: `${gig?.title ?? ''} — ${tier.name}`.trim(),
        unit_price_idr: tier.price_idr,
        quantity: 1,
        subtotal_idr: tier.price_idr,
        status: 'unpaid',
        created_at: new Date().toISOString(),
      });
      order.total_idr += tier.price_idr;
      order.outstanding_idr += tier.price_idr;
      return { status: 201, body: envelope(order) };
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

  // ---- phase 4: bids ----
  {
    method: 'get',
    path: /^\/market\/v1\/bid-categories$/,
    reply: () => ({ status: 200, body: envelope(BID_CATEGORIES) }),
  },
  {
    method: 'get',
    path: /^\/market\/v1\/bids$/,
    reply: (config) => {
      const account = caller(config);
      if (!account) return { status: 401, body: unauthorized() };
      const params = (config.params ?? {}) as { mode?: string; status?: string };
      // Persona-scoped, like orders: a customer sees their own bids; a lapak
      // sees open manual bids plus the automatic ones it was matched to.
      let rows = account.lapak
        ? BIDS.filter(
            (b) =>
              (b.mode === 'manual' && b.status === 'open') ||
              b.matched_lapak?.id === account.lapak?.id
          )
        : BIDS.filter((b) => b.customer.id === account.user.id);
      if (params.mode) rows = rows.filter((b) => b.mode === params.mode);
      if (params.status) rows = rows.filter((b) => b.status === params.status);
      const page = paginate(rows.map(bidView), config);
      return { status: 200, body: envelope(page.rows, { pagination: page.pagination }) };
    },
  },
  {
    method: 'post',
    path: /^\/market\/v1\/bids$/,
    reply: (config) => {
      const account = caller(config);
      if (!account) return { status: 401, body: unauthorized() };
      if (account.lapak) {
        return {
          status: 403,
          body: errorBody('detail', 'Hanya pelanggan yang dapat membuat bid.'),
        };
      }
      const body = bodyOf<{
        mode?: 'auto' | 'manual';
        category_id?: string;
        title?: string;
        description?: string;
        budget_idr?: number;
        lat?: number;
        lng?: number;
      }>(config);

      const category = BID_CATEGORIES.find((c) => c.id === body.category_id);
      if (!category) return { status: 404, body: notFound() };
      if (!body.budget_idr || body.budget_idr < 1) {
        return { status: 422, body: errorBody('budget_idr', 'Anggaran wajib diisi.') };
      }
      if (body.mode !== 'auto' && body.mode !== 'manual') {
        return { status: 422, body: errorBody('mode', 'Mode bid tidak valid.') };
      }
      // The contract requires an origin for mode=auto and the backend enforces
      // it (chk_bids_auto_has_origin). This mock used to DEFAULT the
      // coordinates when they were absent, which hid a hard requirement for an
      // entire sprint: FE-E was verified green here and 422'd against the real
      // API. A mock more permissive than the contract manufactures false
      // passes, so it now rejects exactly what the backend rejects.
      if (body.mode === 'auto' && (typeof body.lat !== 'number' || typeof body.lng !== 'number')) {
        return { status: 422, body: errorBody('lat', 'Lokasi wajib diisi untuk bid otomatis.') };
      }

      const wallet = WALLETS[account.login];
      const now = new Date().toISOString();
      const bid: MockBid = {
        id: nextId('b'),
        mode: body.mode,
        status: body.mode === 'manual' ? 'open' : 'matching',
        category,
        customer: { id: account.user.id, full_name: account.user.full_name },
        title: body.title ?? category.name,
        description: body.description ?? null,
        budget_idr: body.budget_idr,
        // No `??` fallback: for `auto` these are validated above, and a manual
        // bid has no matching origin to invent.
        lat: body.lat ?? 0,
        lng: body.lng ?? 0,
        fee_paid_idr: 0,
        matched_lapak: null,
        matched_distance_km: null,
        offer_count: 0,
        accepted_offer_id: null,
        order_id: null,
        // Manual bids carry the off-platform risk: nothing is tracked until the
        // customer awards on-platform.
        off_platform_risk: body.mode === 'manual',
        created_at: now,
      };

      if (bid.mode === 'manual') {
        // Free to post; the 10 000 fee is charged at award, not here.
        BIDS.unshift(bid);
        return { status: 201, body: envelope(bidView(bid)) };
      }

      // Automatic: the fee is charged BEFORE matching runs, per the contract.
      const fee = CONFIG_ROW.bid_auto_fee_idr;
      if (wallet.balance_idr < fee) {
        return {
          status: 402,
          body: errorBody('detail', 'Saldo tidak mencukupi untuk biaya bid.'),
        };
      }
      wallet.balance_idr -= fee;
      LEDGERS[account.login].unshift({
        id: nextId('3'),
        type: 'platform_fee',
        amount_idr: -fee,
        balance_after_idr: wallet.balance_idr,
        order_id: null,
        bid_id: bid.id,
        note: 'Biaya bid otomatis',
        created_at: now,
      });
      bid.fee_paid_idr = fee;

      const match = matchLapak(bid.lat, bid.lng);
      if (!match) {
        // Nobody available: refund in the same step. Charging for a match that
        // never happened would be a real money bug, not a corner case.
        wallet.balance_idr += fee;
        LEDGERS[account.login].unshift({
          id: nextId('3'),
          type: 'refund',
          amount_idr: fee,
          balance_after_idr: wallet.balance_idr,
          order_id: null,
          bid_id: bid.id,
          note: 'Pengembalian biaya bid (tidak ada tukang tersedia)',
          created_at: new Date().toISOString(),
        });
        bid.fee_paid_idr = 0;
        bid.status = 'no_match';
      } else {
        bid.status = 'proposed';
        bid.matched_lapak = lapakSummary(match.lapak);
        bid.matched_distance_km = Math.round(match.km * 1000) / 1000;
      }
      BIDS.unshift(bid);
      return { status: 201, body: envelope(bidView(bid)) };
    },
  },
  {
    method: 'get',
    path: /^\/market\/v1\/bids\/[^/]+$/,
    reply: (config) => {
      const bid = BIDS.find((b) => b.id === segment(config, 0));
      if (!bid) return { status: 404, body: notFound() };
      return { status: 200, body: envelope(bidView(bid)) };
    },
  },
  {
    method: 'post',
    path: /^\/market\/v1\/bids\/[^/]+\/confirm$/,
    reply: (config) => {
      const account = caller(config);
      const bid = BIDS.find((b) => b.id === segment(config, 1));
      if (!account) return { status: 401, body: unauthorized() };
      if (!bid) return { status: 404, body: notFound() };
      if (bid.customer.id !== account.user.id) {
        return { status: 403, body: errorBody('detail', 'Bukan bid Anda.') };
      }
      if (bid.status !== 'proposed') {
        return { status: 409, body: errorBody('detail', 'Bid tidak dalam status proposed.') };
      }
      bid.status = 'customer_confirmed';
      return { status: 200, body: envelope(bidView(bid)) };
    },
  },
  {
    method: 'post',
    path: /^\/market\/v1\/bids\/[^/]+\/accept$/,
    reply: (config) => {
      const account = caller(config);
      const bid = BIDS.find((b) => b.id === segment(config, 1));
      if (!account) return { status: 401, body: unauthorized() };
      if (!bid) return { status: 404, body: notFound() };
      if (!account.lapak || bid.matched_lapak?.id !== account.lapak.id) {
        return { status: 403, body: errorBody('detail', 'Bukan tukang yang dicocokkan.') };
      }
      if (bid.status !== 'customer_confirmed') {
        return { status: 409, body: errorBody('detail', 'Pelanggan belum mengonfirmasi.') };
      }
      const order = createBidOrder(bid, bid.matched_lapak, bid.budget_idr, 'bid_auto');
      bid.status = 'ordered';
      bid.order_id = order.id;
      return { status: 200, body: envelope(bidView(bid)) };
    },
  },
  {
    method: 'get',
    path: /^\/market\/v1\/bids\/[^/]+\/offers$/,
    reply: (config) => {
      const bid = BIDS.find((b) => b.id === segment(config, 1));
      if (!bid) return { status: 404, body: notFound() };
      const rows = OFFERS.filter((o) => o.bid_id === bid.id).sort(
        (a, b) => a.amount_idr - b.amount_idr
      );
      return { status: 200, body: envelope(rows) };
    },
  },
  {
    method: 'post',
    path: /^\/market\/v1\/bids\/[^/]+\/offers$/,
    reply: (config) => {
      const account = caller(config);
      const bid = BIDS.find((b) => b.id === segment(config, 1));
      if (!account) return { status: 401, body: unauthorized() };
      if (!bid) return { status: 404, body: notFound() };
      if (!account.lapak) {
        return { status: 403, body: errorBody('detail', 'Hanya tukang yang dapat menawar.') };
      }
      if (bid.mode !== 'manual' || bid.status !== 'open') {
        return { status: 409, body: errorBody('detail', 'Bid tidak menerima penawaran.') };
      }
      const body = bodyOf<{ amount_idr?: number; message?: string }>(config);
      if (!body.amount_idr || body.amount_idr < 1) {
        return { status: 422, body: errorBody('amount_idr', 'Nominal penawaran wajib diisi.') };
      }
      // One offer per lapak per bid — posting again REPLACES, per the contract.
      const existing = OFFERS.find((o) => o.bid_id === bid.id && o.lapak.id === account.lapak?.id);
      if (existing) {
        existing.amount_idr = body.amount_idr;
        existing.message = body.message ?? null;
        return { status: 200, body: envelope(existing) };
      }
      const offer: MockOffer = {
        id: nextId('o'),
        bid_id: bid.id,
        lapak: lapakSummary(account.lapak),
        amount_idr: body.amount_idr,
        message: body.message ?? null,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      OFFERS.push(offer);
      bid.offer_count = OFFERS.filter((o) => o.bid_id === bid.id).length;
      return { status: 201, body: envelope(offer) };
    },
  },
  {
    method: 'post',
    path: /^\/market\/v1\/bids\/[^/]+\/offers\/[^/]+\/award$/,
    reply: (config) => {
      const account = caller(config);
      const bid = BIDS.find((b) => b.id === segment(config, 3));
      const offer = OFFERS.find((o) => o.id === segment(config, 1));
      if (!account) return { status: 401, body: unauthorized() };
      if (!bid || !offer || offer.bid_id !== bid.id) return { status: 404, body: notFound() };
      if (bid.customer.id !== account.user.id) {
        return { status: 403, body: errorBody('detail', 'Bukan bid Anda.') };
      }
      if (bid.status !== 'open') {
        return { status: 409, body: errorBody('detail', 'Bid sudah tidak terbuka.') };
      }

      const wallet = WALLETS[account.login];
      const fee = CONFIG_ROW.bid_manual_fee_idr;
      if (wallet.balance_idr < fee) {
        return {
          status: 402,
          body: errorBody('detail', 'Saldo tidak mencukupi untuk biaya platform.'),
        };
      }
      wallet.balance_idr -= fee;
      LEDGERS[account.login].unshift({
        id: nextId('3'),
        type: 'platform_fee',
        amount_idr: -fee,
        balance_after_idr: wallet.balance_idr,
        order_id: null,
        bid_id: bid.id,
        note: 'Biaya platform (bid manual)',
        created_at: new Date().toISOString(),
      });

      offer.status = 'awarded';
      OFFERS.filter((o) => o.bid_id === bid.id && o.id !== offer.id).forEach((o) => {
        o.status = 'rejected';
      });
      // The order is priced from the AWARDED OFFER, not the posted budget.
      const order = createBidOrder(bid, offer.lapak, offer.amount_idr, 'bid_manual');
      bid.status = 'ordered';
      bid.accepted_offer_id = offer.id;
      bid.order_id = order.id;
      bid.fee_paid_idr = fee;
      bid.off_platform_risk = false;
      return { status: 200, body: envelope(bidView(bid)) };
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
        sender_user_id: caller(config)?.user.id ?? CUSTOMER.id,
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
/**
 * Make a mocked run impossible to mistake for a real one.
 *
 * A wrong backend port yields empty-but-successful responses — those look wrong
 * and get investigated. Mocks fail the other way: the fixtures here are
 * deliberately realistic, down to a working checkout and a genuine 402 at wallet
 * depletion, so a stray `VITE_USE_MOCKS=true` yields a populated, coherent,
 * entirely fake app. That is a false PASS, and it survives review.
 *
 * So say so twice: in the console for logs, and on the page for screenshots —
 * a console line is invisible in a screenshot taken without DevTools open, and
 * screenshots are how QA runs are reported.
 */
function announceMockMode(): void {
  console.warn(
    '%c MOCKS ON %c /market/v1/* is served from src/shared/lib/market-mock.ts — this is NOT the real backend.',
    'background:#B71C1C;color:#fff;font-weight:700',
    'color:#B71C1C;font-weight:600'
  );

  if (typeof document === 'undefined') return;

  const paint = () => {
    if (document.getElementById('market-mock-badge')) return;
    const badge = document.createElement('div');
    badge.id = 'market-mock-badge';
    badge.textContent = 'MOCK DATA — not the real backend';
    badge.setAttribute('data-testid', 'market-mock-badge');
    badge.style.cssText = [
      'position:fixed',
      'left:0',
      'right:0',
      'bottom:0',
      'z-index:2147483647',
      'padding:4px 8px',
      'background:#B71C1C',
      'color:#fff',
      'font:600 12px/1.4 ui-monospace,monospace',
      'text-align:center',
      'letter-spacing:.04em',
      // Never swallow a click meant for the app underneath it.
      'pointer-events:none',
    ].join(';');
    document.body.appendChild(badge);
  };

  if (document.body) {
    paint();
  } else {
    document.addEventListener('DOMContentLoaded', paint, { once: true });
  }
}

export function installMarketMock(instance: AxiosInstance): void {
  announceMockMode();
  hydrate();

  const realAdapter = instance.defaults.adapter as AxiosAdapter;

  instance.defaults.adapter = async (config) => {
    const route = findRoute(config);
    if (!route) return realAdapter(config);

    const { status, body } = route.reply(config);

    // Persist after anything that could have mutated the fixture. GETs cannot,
    // so they stay free.
    if ((config.method ?? 'get').toLowerCase() !== 'get') {
      persist();
    }

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
