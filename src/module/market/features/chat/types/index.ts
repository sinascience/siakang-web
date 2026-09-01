// ----------------------------------------------------------------------
// contract/api-v1.yaml v1 (frozen) — /market/v1/chat/*
// ----------------------------------------------------------------------

export type ChatMessage = {
  id: string;
  thread_id: string;
  /** Compare with the signed-in user's id to place the bubble. Never a persona flag. */
  sender_user_id: string;
  /** 1..2000 chars. */
  body: string;
  created_at: string;
};

export type ChatThreadCustomer = {
  id: string;
  full_name: string;
};

export type ChatThreadLapak = {
  id: string;
  name: string;
  rating: number;
};

export type ChatThread = {
  id: string;
  /** Every thread belongs to an order — the server opens it, the client never does. */
  order_id: string;
  customer: ChatThreadCustomer;
  lapak: ChatThreadLapak;
  last_message: ChatMessage | null;
  created_at: string;
};

export type ListMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type ChatListParams = {
  page?: number;
  limit?: number;
};
