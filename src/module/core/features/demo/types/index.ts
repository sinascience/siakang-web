// ----------------------------------------------------------------------
// Demo module — "Item" entity.
// Backed by an in-memory dummy store (see ../api). No real backend.
// ----------------------------------------------------------------------

export type ItemCategory = 'electronics' | 'furniture' | 'stationery' | 'food' | 'other';

export const ITEM_CATEGORIES: ItemCategory[] = [
  'electronics',
  'furniture',
  'stationery',
  'food',
  'other',
];

export type Item = {
  id: string;
  code: string;
  name: string;
  category: ItemCategory;
  price: number;
  stock: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ItemListParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: ItemCategory | '';
  is_active?: boolean;
};

export type CreateItemPayload = {
  code?: string;
  name: string;
  category: ItemCategory;
  price: number;
  stock: number;
  description?: string | null;
  is_active?: boolean;
};

export type UpdateItemPayload = Partial<CreateItemPayload> & {
  is_active?: boolean;
};
