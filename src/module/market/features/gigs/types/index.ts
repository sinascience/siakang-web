// ----------------------------------------------------------------------
// contract/api-v1.yaml v1 (frozen) — GET /market/v1/gigs, GET /market/v1/gigs/{id}
//
// A gig is a service with PRICE TIERS. Flow B's whole point: the customer buys
// the cheapest tier to start the conversation, and a bigger tier can later be
// appended to that SAME order (see orders/api `addOrderItem`).
// ----------------------------------------------------------------------

export type GigLapak = {
  id: string;
  name: string;
  rating: number;
};

export type GigTier = {
  id: string;
  gig_id: string;
  /** May be empty — not `required` on the contract. */
  description: string;
  name: string;
  /** Whole rupiah. Never cents. */
  price_idr: number;
};

export type Gig = {
  id: string;
  title: string;
  /** May be empty — not `required` on the contract. */
  description: string;
  image_url: string | null;
  lapak: GigLapak;
  /** Ordered by price ascending, per the contract — rendered in the order given. */
  tiers: GigTier[];
};

export type GigListParams = {
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
