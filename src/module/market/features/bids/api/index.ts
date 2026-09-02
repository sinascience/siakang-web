import type { ApiEnvelope } from 'src/module/core/features/auth/types';
import type {
  Bid,
  BidOffer,
  BidCategory,
  BidListMeta,
  BidListParams,
  CreateBidParams,
  PlaceOfferParams,
} from '../types';

import axios, { endpoints, flattenFieldErrors } from 'src/shared/lib/axios';

// ----------------------------------------------------------------------
// Flow C API. Master-owned: FE-E, FE-F and FE-I all call into this, so it is
// written once rather than raced by three minors.
//
// Same `unwrap<T>()` shape as every other feature in this repo — each carries
// its own; `src/shared/api/index.ts` is an empty stub.
// ----------------------------------------------------------------------

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const res = await promise;
  const payload = res.data;
  if (payload.data === null || payload.data === undefined) {
    const { errors } = payload;
    const detail =
      (typeof errors === 'string' ? errors : errors && flattenFieldErrors(errors)) ||
      payload.message ||
      'Empty response';
    throw new Error(detail);
  }
  return payload.data;
}

export function listBidCategories(): Promise<BidCategory[]> {
  return unwrap<BidCategory[]>(axios.get(endpoints.market.bidCategories));
}

export async function listBids(
  params: BidListParams = {}
): Promise<{ data: Bid[]; meta: BidListMeta }> {
  const res = await axios.get<ApiEnvelope<Bid[]>>(endpoints.market.bids.list, {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 25,
      ...(params.mode ? { mode: params.mode } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  });
  const data = res.data.data ?? [];
  const pagination = (res.data.meta as { pagination?: BidListMeta } | null)?.pagination;
  return {
    data,
    meta: {
      page: pagination?.page ?? 1,
      limit: pagination?.limit ?? data.length,
      total: pagination?.total ?? data.length,
      total_pages: pagination?.total_pages ?? 1,
    },
  };
}

export function getBid(id: string): Promise<Bid> {
  return unwrap<Bid>(axios.get(endpoints.market.bids.byId(id)));
}

/**
 * `mode: 'auto'` charges `config.bid_auto_fee_idr` BEFORE matching runs, so a
 * 402 here means nothing was written and no bid exists. `mode: 'manual'` is
 * free to post; its fee is charged at award.
 */
export function createBid(params: CreateBidParams): Promise<Bid> {
  return unwrap<Bid>(axios.post(endpoints.market.bids.list, params));
}

/** Automatic, customer half: `proposed` → `customer_confirmed`. No money moves. */
export function confirmBid(id: string): Promise<Bid> {
  return unwrap<Bid>(axios.post(endpoints.market.bids.confirm(id)));
}

/** Automatic, lapak half: `customer_confirmed` → the tracked order is created. */
export function acceptBid(id: string): Promise<Bid> {
  return unwrap<Bid>(axios.post(endpoints.market.bids.accept(id)));
}

export function listBidOffers(bidId: string): Promise<BidOffer[]> {
  return unwrap<BidOffer[]>(axios.get(endpoints.market.bids.offers(bidId)));
}

/** One offer per lapak per bid — posting again REPLACES the amount and message. */
export function placeBidOffer(bidId: string, params: PlaceOfferParams): Promise<BidOffer> {
  return unwrap<BidOffer>(axios.post(endpoints.market.bids.offers(bidId), params));
}

/**
 * Manual, customer half: debits `config.bid_manual_fee_idr` and creates the
 * tracked order priced from the AWARDED OFFER, not the posted budget.
 */
export function awardBidOffer(bidId: string, offerId: string): Promise<Bid> {
  return unwrap<Bid>(axios.post(endpoints.market.bids.award(bidId, offerId)));
}
