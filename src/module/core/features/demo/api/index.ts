import type {
  Item,
  ItemCategory,
  ItemListParams,
  CreateItemPayload,
  UpdateItemPayload,
} from '../types';

// ----------------------------------------------------------------------
// In-memory dummy store for the Demo module.
//
// Mirrors the shape of the real branches API (see ../../branches/api) so the
// UI/UX pattern is identical, but there is NO network — data lives in this
// module for the app lifetime. All CRUD operations mutate this array and
// return promises with a small simulated latency so loading states behave
// like the real thing.
// ----------------------------------------------------------------------

type Meta = { page: number; limit: number; total: number; total_pages: number };

// Two independent datasets: `default` is pre-seeded, `empty` starts with no
// rows (used by the "Item Empty" page). Each is a fully working CRUD store.
export type ItemDataset = 'default' | 'empty';

const LATENCY = 350; // ms — simulate network round-trip

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), LATENCY);
  });
}

// ----------------------------------------------------------------------

const SEED_NAMES: { name: string; category: ItemCategory }[] = [
  { name: 'Wireless Mouse', category: 'electronics' },
  { name: 'Mechanical Keyboard', category: 'electronics' },
  { name: 'USB-C Hub', category: 'electronics' },
  { name: '27" Monitor', category: 'electronics' },
  { name: 'Noise Cancelling Headphone', category: 'electronics' },
  { name: 'Webcam 1080p', category: 'electronics' },
  { name: 'Ergonomic Chair', category: 'furniture' },
  { name: 'Standing Desk', category: 'furniture' },
  { name: 'Bookshelf', category: 'furniture' },
  { name: 'Filing Cabinet', category: 'furniture' },
  { name: 'Meeting Table', category: 'furniture' },
  { name: 'Ballpoint Pen (Box)', category: 'stationery' },
  { name: 'Sticky Notes', category: 'stationery' },
  { name: 'A4 Paper Ream', category: 'stationery' },
  { name: 'Whiteboard Marker', category: 'stationery' },
  { name: 'Stapler', category: 'stationery' },
  { name: 'Document Folder', category: 'stationery' },
  { name: 'Instant Coffee', category: 'food' },
  { name: 'Green Tea (Box)', category: 'food' },
  { name: 'Mineral Water (Crate)', category: 'food' },
  { name: 'Biscuit Assortment', category: 'food' },
  { name: 'Sugar Pack', category: 'food' },
  { name: 'First Aid Kit', category: 'other' },
  { name: 'Extension Cord', category: 'other' },
  { name: 'Desk Lamp', category: 'other' },
  { name: 'Trash Bin', category: 'other' },
  { name: 'Umbrella', category: 'other' },
  { name: 'Power Bank 10000mAh', category: 'electronics' },
];

const CATEGORY_PRICE: Record<ItemCategory, number> = {
  electronics: 450_000,
  furniture: 1_250_000,
  stationery: 35_000,
  food: 25_000,
  other: 80_000,
};

function seed(): Item[] {
  const base = Date.parse('2025-01-01T00:00:00Z');
  return SEED_NAMES.map((entry, i) => {
    const ts = new Date(base + i * 86_400_000).toISOString();
    const priceBase = CATEGORY_PRICE[entry.category];
    return {
      id: `item-${String(i + 1).padStart(4, '0')}`,
      code: `ITM${String(i + 1).padStart(4, '0')}`,
      name: entry.name,
      category: entry.category,
      price: priceBase + (i % 5) * 15_000,
      stock: ((i * 7) % 90) + 5,
      description: null,
      is_active: i % 6 !== 0, // a few inactive for variety
      created_at: ts,
      updated_at: ts,
    };
  });
}

const stores: Record<ItemDataset, Item[]> = {
  default: seed(),
  empty: [],
};

const sequences: Record<ItemDataset, number> = {
  default: stores.default.length,
  empty: 0,
};

// ----------------------------------------------------------------------

export async function listItemsPaginated(
  dataset: ItemDataset,
  params: ItemListParams = {}
): Promise<{ data: Item[]; meta: Meta }> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 25;
  const search = (params.search ?? '').trim().toLowerCase();

  let filtered = [...stores[dataset]].sort((a, b) => b.created_at.localeCompare(a.created_at));

  if (search) {
    filtered = filtered.filter(
      (it) =>
        it.name.toLowerCase().includes(search) || it.code.toLowerCase().includes(search)
    );
  }
  if (params.category) {
    filtered = filtered.filter((it) => it.category === params.category);
  }
  if (typeof params.is_active === 'boolean') {
    filtered = filtered.filter((it) => it.is_active === params.is_active);
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return delay({
    data,
    meta: {
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}

export async function getItem(dataset: ItemDataset, id: string): Promise<Item> {
  const found = stores[dataset].find((it) => it.id === id);
  if (!found) throw new Error('Item not found');
  return delay({ ...found });
}

export async function createItem(
  dataset: ItemDataset,
  payload: CreateItemPayload
): Promise<Item> {
  const now = new Date().toISOString();
  sequences[dataset] += 1;
  const seq = sequences[dataset];
  const item: Item = {
    id: `${dataset}-item-${String(seq).padStart(4, '0')}`,
    code: payload.code?.trim() || `ITM${String(seq).padStart(4, '0')}`,
    name: payload.name.trim(),
    category: payload.category,
    price: payload.price,
    stock: payload.stock,
    description: payload.description?.trim() || null,
    is_active: payload.is_active ?? true,
    created_at: now,
    updated_at: now,
  };
  stores[dataset] = [item, ...stores[dataset]];
  return delay({ ...item });
}

export async function updateItem(
  dataset: ItemDataset,
  id: string,
  payload: UpdateItemPayload
): Promise<Item> {
  const list = stores[dataset];
  const index = list.findIndex((it) => it.id === id);
  if (index === -1) throw new Error('Item not found');

  const current = list[index];
  const updated: Item = {
    ...current,
    ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
    ...(payload.category !== undefined ? { category: payload.category } : {}),
    ...(payload.price !== undefined ? { price: payload.price } : {}),
    ...(payload.stock !== undefined ? { stock: payload.stock } : {}),
    ...(payload.description !== undefined
      ? { description: payload.description?.trim() || null }
      : {}),
    ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
    updated_at: new Date().toISOString(),
  };
  list[index] = updated;
  return delay({ ...updated });
}

export async function deleteItem(dataset: ItemDataset, id: string): Promise<{ id: string }> {
  const exists = stores[dataset].some((it) => it.id === id);
  if (!exists) throw new Error('Item not found');
  stores[dataset] = stores[dataset].filter((it) => it.id !== id);
  return delay({ id });
}

// ----------------------------------------------------------------------
// Dummy "import" — seeds a handful of sample rows into the dataset so the
// empty-state Import button demonstrates a real, working flow.
// ----------------------------------------------------------------------

const SAMPLE_IMPORT: Omit<Item, 'id' | 'code' | 'created_at' | 'updated_at'>[] = [
  { name: 'Sample Laptop 14"', category: 'electronics', price: 8_500_000, stock: 12, description: null, is_active: true },
  { name: 'Sample Office Chair', category: 'furniture', price: 1_250_000, stock: 20, description: null, is_active: true },
  { name: 'Sample Notebook A5', category: 'stationery', price: 15_000, stock: 150, description: null, is_active: true },
  { name: 'Sample Ground Coffee', category: 'food', price: 45_000, stock: 80, description: null, is_active: true },
  { name: 'Sample Power Bank', category: 'electronics', price: 250_000, stock: 35, description: null, is_active: false },
];

export async function importSampleItems(dataset: ItemDataset): Promise<{ imported: number }> {
  const now = new Date().toISOString();
  const created: Item[] = SAMPLE_IMPORT.map((entry) => {
    sequences[dataset] += 1;
    const seq = sequences[dataset];
    return {
      ...entry,
      id: `${dataset}-item-${String(seq).padStart(4, '0')}`,
      code: `ITM${String(seq).padStart(4, '0')}`,
      created_at: now,
      updated_at: now,
    };
  });
  stores[dataset] = [...created, ...stores[dataset]];
  return delay({ imported: created.length });
}
