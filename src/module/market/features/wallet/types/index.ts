// ----------------------------------------------------------------------
// contract/api-v1.yaml v1 (frozen) — GET /market/v1/wallet, GET /market/v1/wallet/ledger
// ----------------------------------------------------------------------

export type Wallet = {
  user_id: string;
  /** Whole rupiah, NOT cents. 5000000 = Rp 5.000.000. */
  balance_idr: number;
};

export type LedgerEntryType = 'topup' | 'order_payment' | 'platform_fee' | 'payout' | 'refund';

export type LedgerEntry = {
  id: string;
  type: LedgerEntryType;
  /** Signed — negative = money left this wallet, positive = money arrived. */
  amount_idr: number;
  balance_after_idr: number;
  order_id: string | null;
  bid_id: string | null;
  note: string;
  created_at: string;
};

export type WalletLedgerListParams = {
  page?: number;
  limit?: number;
};

export type ListMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};
