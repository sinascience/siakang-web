// ----------------------------------------------------------------------
// contract/api-v1.yaml v1 (frozen) — GET /market/v1/products, GET /market/v1/products/{id}
// ----------------------------------------------------------------------

export type ProductLapak = {
  id: string;
  name: string;
  rating: number;
};

export type Product = {
  id: string;
  title: string;
  /** May be empty — not `required` on the contract. */
  description: string;
  /** Whole rupiah. Never cents. */
  price_idr: number;
  image_url: string | null;
  lapak: ProductLapak;
};

export type ProductListParams = {
  page?: number;
  limit?: number;
  q?: string;
};

export type ListMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};
