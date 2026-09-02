import type { Order } from 'src/module/market/features/orders/types';

// ----------------------------------------------------------------------
// Contract shapes for flow C. Master-owned so FE-E (auto), FE-F (manual) and
// FE-I (lapak offers) can be built in parallel without three minors writing
// one api module — the conflict `allowed_paths` exists to prevent.
// ----------------------------------------------------------------------

export type BidMode = 'auto' | 'manual';

/**
 * Automatic: `proposed` → `customer_confirmed` → `accepted`, or `no_match`.
 * Manual:    `open` → `awarded`.
 * Either may end `cancelled`; `ordered` once a tracked order exists.
 */
export type BidStatus =
  | 'matching'
  | 'proposed'
  | 'customer_confirmed'
  | 'accepted'
  | 'no_match'
  | 'open'
  | 'awarded'
  | 'ordered'
  | 'cancelled';

export type BidCategory = {
  id: string;
  name: string;
  slug: string;
};

export type BidLapak = {
  id: string;
  name: string;
  rating: number;
};

export type BidOfferStatus = 'pending' | 'awarded' | 'rejected';

export type BidOffer = {
  id: string;
  bid_id: string;
  lapak: BidLapak;
  amount_idr: number;
  message: string | null;
  status: BidOfferStatus;
  created_at: string;
};

export type Bid = {
  id: string;
  mode: BidMode;
  status: BidStatus;
  category: BidCategory;
  customer: { id: string; full_name: string };
  title: string;
  description: string | null;
  /** Integer rupiah. Required for both modes (contract v1.0.1). */
  budget_idr: number;
  lat: number;
  lng: number;
  /** What the platform actually debited so far — 0 while a manual bid is open. */
  fee_paid_idr: number;
  /** Automatic bids only: the nearest AVAILABLE lapak, ties broken by rating. */
  matched_lapak: BidLapak | null;
  matched_distance_km: number | null;
  offer_count: number;
  accepted_offer_id: string | null;
  order_id: string | null;
  /**
   * True while no on-platform agreement exists (a manual bid still `open`).
   * The platform cannot block an off-platform deal; this is the signal to warn
   * the customer that such a transaction is untracked. Warning copy is FE i18n,
   * never API text.
   */
  off_platform_risk: boolean;
  created_at: string;
};

export type CreateBidParams = {
  mode: BidMode;
  category_id: string;
  /** Required for `manual`; sensible for both. */
  title?: string;
  description?: string;
  /** Integer rupiah, required for BOTH modes — it prices the resulting order. */
  budget_idr: number;
  /** Matching origin for `auto`. */
  lat?: number;
  lng?: number;
};

export type PlaceOfferParams = {
  amount_idr: number;
  message?: string;
};

export type BidListParams = {
  page?: number;
  limit?: number;
  mode?: BidMode;
  status?: BidStatus;
};

export type BidListMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

/** A bid that produced a tracked order carries its id; callers fetch the order. */
export type BidWithOrder = Bid & { order?: Order | null };
