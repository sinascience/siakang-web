import type { ApiEnvelope } from 'src/module/core/features/auth/types';
import type { ListMeta, ChatThread, ChatMessage, ChatListParams } from '../types';

import axios, { endpoints, flattenFieldErrors } from 'src/shared/lib/axios';

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

async function unwrapList<T>(
  promise: Promise<{ data: ApiEnvelope<T[]> }>
): Promise<{ data: T[]; meta: ListMeta }> {
  const res = await promise;
  const payload = res.data;
  const data = payload.data ?? [];
  const pagination = (payload.meta as { pagination?: ListMeta } | null | undefined)?.pagination;
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

/** Threads the caller takes part in — the JWT scopes them, there is no persona param. */
export function listChatThreads(params: ChatListParams = {}) {
  return unwrapList<ChatThread>(
    axios.get(endpoints.market.chat.threads, {
      params: { page: params.page ?? 1, limit: params.limit ?? 50 },
    })
  );
}

/** One page of history, **newest first** (contract). Reversed for display, not here. */
export function listChatMessages(threadId: string, params: ChatListParams = {}) {
  return unwrapList<ChatMessage>(
    axios.get(endpoints.market.chat.messages(threadId), {
      params: { page: params.page ?? 1, limit: params.limit ?? 50 },
    })
  );
}

/** 201 with the created message. A blank body is a 422 with `errors.body`. */
export function sendChatMessage(threadId: string, body: string): Promise<ChatMessage> {
  return unwrap<ChatMessage>(axios.post(endpoints.market.chat.messages(threadId), { body }));
}
