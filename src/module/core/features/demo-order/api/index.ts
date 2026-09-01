import type {
  Order,
  OrderLine,
  OrderEvent,
  OrderStatus,
  OrderListItem,
  PaymentMethod,
  OrderListParams,
} from '../types';

// ----------------------------------------------------------------------
// In-memory dummy store for the Demo "Order" module.
//
// Same idea as ../../demo/api (the Item store): no network, data lives here
// for the app lifetime, every call resolves after a small delay so loading
// states behave like the real thing.
//
// One difference worth copying in real features: `listOrders` returns a
// LIGHTER row shape than `getOrder`. The list has no line items and no
// timeline, so the detail page must fetch by id — which is exactly the
// behaviour a page-based detail view needs (deep-link, refresh, back button).
// ----------------------------------------------------------------------

type Meta = { page: number; limit: number; total: number; total_pages: number };

const LATENCY = 350; // ms — simulate network round-trip

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), LATENCY);
  });
}

// ----------------------------------------------------------------------
// Seed
// ----------------------------------------------------------------------

const CUSTOMERS = [
  {
    name: 'Andi Pratama',
    email: 'andi.pratama@mail.com',
    phone: '0812-3344-5566',
    city: 'Jakarta Selatan',
    address: 'Jl. Kemang Raya No. 21, RT 004/RW 002',
  },
  {
    name: 'Siti Rahmawati',
    email: 'siti.rahma@mail.com',
    phone: '0813-7788-9900',
    city: 'Bandung',
    address: 'Jl. Dipatiukur No. 112',
  },
  {
    name: 'Budi Santoso',
    email: 'budi.santoso@mail.com',
    phone: '0857-2211-4433',
    city: 'Surabaya',
    address: 'Jl. Raya Darmo No. 88, Blok C',
  },
  {
    name: 'Dewi Lestari',
    email: 'dewi.lestari@mail.com',
    phone: '0878-9911-2233',
    city: 'Yogyakarta',
    address: 'Jl. Kaliurang KM 5,5 No. 17',
  },
  {
    name: 'Rizky Ramadhan',
    email: 'rizky.rmd@mail.com',
    phone: '0811-5566-7788',
    city: 'Medan',
    address: 'Jl. Gatot Subroto No. 45',
  },
  {
    name: 'Putri Anggraini',
    email: 'putri.angg@mail.com',
    phone: '0895-3344-1122',
    city: 'Semarang',
    address: 'Jl. Pandanaran No. 9',
  },
  {
    name: 'Fajar Nugroho',
    email: 'fajar.nugroho@mail.com',
    phone: '0821-6677-8899',
    city: 'Makassar',
    address: 'Jl. Boulevard Panakkukang No. 3',
  },
  {
    name: 'Maya Kusuma',
    email: 'maya.kusuma@mail.com',
    phone: '0838-1122-3344',
    city: 'Denpasar',
    address: 'Jl. Sunset Road No. 200',
  },
  {
    name: 'Hendra Wijaya',
    email: 'hendra.wijaya@mail.com',
    phone: '0812-9988-7766',
    city: 'Palembang',
    address: 'Jl. Demang Lebar Daun No. 62',
  },
  {
    name: 'Nadia Safira',
    email: 'nadia.safira@mail.com',
    phone: '0819-4455-6677',
    city: 'Tangerang',
    address: 'Jl. Boulevard Gading Serpong Blok A2',
  },
  {
    name: 'Yoga Permana',
    email: 'yoga.permana@mail.com',
    phone: '0856-3311-2299',
    city: 'Malang',
    address: 'Jl. Soekarno Hatta No. 15',
  },
  {
    name: 'Intan Maharani',
    email: 'intan.mahara@mail.com',
    phone: '0877-2244-6688',
    city: 'Balikpapan',
    address: 'Jl. Jenderal Sudirman No. 78',
  },
];

const CATALOG = [
  { sku: 'ITM0001', name: 'Wireless Mouse', price: 185_000 },
  { sku: 'ITM0002', name: 'Mechanical Keyboard', price: 750_000 },
  { sku: 'ITM0003', name: 'USB-C Hub 7-in-1', price: 425_000 },
  { sku: 'ITM0004', name: '27" IPS Monitor', price: 2_850_000 },
  { sku: 'ITM0005', name: 'Noise Cancelling Headphone', price: 1_650_000 },
  { sku: 'ITM0006', name: 'Webcam 1080p', price: 520_000 },
  { sku: 'ITM0007', name: 'Ergonomic Chair', price: 1_950_000 },
  { sku: 'ITM0008', name: 'Standing Desk', price: 3_400_000 },
  { sku: 'ITM0009', name: 'Desk Lamp LED', price: 165_000 },
  { sku: 'ITM0010', name: 'Power Bank 20000mAh', price: 380_000 },
];

// Weighted on purpose: `completed` should dominate so the list looks realistic,
// while every status still appears within the first page.
const STATUS_CYCLE: OrderStatus[] = [
  'completed',
  'processing',
  'shipped',
  'pending',
  'completed',
  'cancelled',
  'shipped',
  'completed',
];

const PAYMENT_CYCLE: PaymentMethod[] = ['transfer', 'card', 'ewallet', 'cod'];

const ORDER_COUNT = 26;
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/** Status progression each order walks through before reaching its final status. */
function buildTimeline(status: OrderStatus, createdAt: string): OrderEvent[] {
  const path: OrderStatus[] =
    status === 'cancelled'
      ? ['pending', 'cancelled']
      : (['pending', 'processing', 'shipped', 'completed'] as OrderStatus[]).slice(
          0,
          ['pending', 'processing', 'shipped', 'completed'].indexOf(status) + 1
        );

  const start = Date.parse(createdAt);
  return path.map((step, i) => ({
    status: step,
    at: new Date(start + i * 18 * HOUR_MS).toISOString(),
  }));
}

function seed(): Order[] {
  const base = Date.parse('2025-03-01T09:00:00Z');

  return Array.from({ length: ORDER_COUNT }, (_, i) => {
    const customer = CUSTOMERS[i % CUSTOMERS.length];
    const status = STATUS_CYCLE[i % STATUS_CYCLE.length];
    const createdAt = new Date(base + i * DAY_MS + (i % 6) * HOUR_MS).toISOString();

    const lineCount = (i % 4) + 1;
    const lines: OrderLine[] = Array.from({ length: lineCount }, (_unused, j) => {
      const product = CATALOG[(i * 7 + j * 3) % CATALOG.length];
      return {
        id: `line-${i + 1}-${j + 1}`,
        sku: product.sku,
        name: product.name,
        qty: ((i + j) % 4) + 1,
        unit_price: product.price,
      };
    });

    const subtotal = lines.reduce((sum, line) => sum + line.qty * line.unit_price, 0);
    const shippingCost = 25_000 + (i % 3) * 10_000;
    const discount = i % 5 === 0 ? 50_000 : 0;
    const timeline = buildTimeline(status, createdAt);

    return {
      id: `order-${String(i + 1).padStart(4, '0')}`,
      number: `ORD-${String(i + 1).padStart(4, '0')}`,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      shipping_address: customer.address,
      shipping_city: customer.city,
      payment_method: PAYMENT_CYCLE[i % PAYMENT_CYCLE.length],
      status,
      lines,
      item_count: lines.reduce((sum, line) => sum + line.qty, 0),
      subtotal,
      shipping_cost: shippingCost,
      discount,
      total: subtotal + shippingCost - discount,
      created_at: createdAt,
      updated_at: timeline[timeline.length - 1].at,
      timeline,
    };
  });
}

let store: Order[] = seed();

// ----------------------------------------------------------------------
// "Endpoints"
// ----------------------------------------------------------------------

function toListItem(order: Order): OrderListItem {
  return {
    id: order.id,
    number: order.number,
    customer_name: order.customer_name,
    status: order.status,
    item_count: order.item_count,
    total: order.total,
    created_at: order.created_at,
  };
}

export async function listOrdersPaginated(
  params: OrderListParams = {}
): Promise<{ data: OrderListItem[]; meta: Meta }> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 25;
  const search = (params.search ?? '').trim().toLowerCase();

  let filtered = [...store].sort((a, b) => b.created_at.localeCompare(a.created_at));

  if (search) {
    filtered = filtered.filter(
      (order) =>
        order.number.toLowerCase().includes(search) ||
        order.customer_name.toLowerCase().includes(search)
    );
  }
  if (params.status) {
    filtered = filtered.filter((order) => order.status === params.status);
  }

  const total = filtered.length;
  const start = (page - 1) * limit;

  return delay({
    data: filtered.slice(start, start + limit).map(toListItem),
    meta: {
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}

export async function getOrder(id: string): Promise<Order> {
  const found = store.find((order) => order.id === id);
  if (!found) throw new Error('NOT_FOUND');
  return delay({ ...found });
}

export async function deleteOrder(id: string): Promise<{ id: string }> {
  const exists = store.some((order) => order.id === id);
  if (!exists) throw new Error('NOT_FOUND');
  store = store.filter((order) => order.id !== id);
  return delay({ id });
}
