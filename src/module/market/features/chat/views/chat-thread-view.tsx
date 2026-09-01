import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { PageHeader } from 'src/shared/ui/page-header';
import { ErrorDialog } from 'src/shared/ui/error-dialog';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuthContext } from 'src/module/core/features/auth/hooks';

import { sendChatMessage } from '../api';
import { useChatStream } from '../hooks/use-chat-stream';
import { useChatThreads } from '../hooks/use-chat-threads';
import { MessageBubble } from '../components/message-bubble';
import { useChatMessages } from '../hooks/use-chat-messages';
import { MessageComposer } from '../components/message-composer';

// ----------------------------------------------------------------------

type Props = {
  threadId: string;
};

export function ChatThreadView({ threadId }: Props) {
  const { t } = useTranslate('chat');
  const { user } = useAuthContext();

  const { messages, loading, error, refresh, append } = useChatMessages(threadId);
  const [sendError, setSendError] = useState<string | null>(null);

  // Resync must be a stable identity for the stream hook's ref, and must
  // swallow nothing: the hook counts a rejection as a failed attempt.
  const stream = useChatStream({ threadId, onMessage: append, onResync: refresh });

  // ponytail: the contract has no GET /chat/threads/{id}, so the list is the
  // only place the counterpart's name and the order link exist. Drop this fetch
  // if the contract ever grows a single-thread endpoint.
  const threads = useChatThreads();
  const thread = threads.data.find((row) => row.id === threadId);
  const counterpart =
    thread && (user?.id === thread.customer.id ? thread.lapak.name : thread.customer.full_name);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const handleSend = useCallback(
    async (body: string) => {
      try {
        await sendChatMessage(threadId, body);
      } catch (err) {
        setSendError(err instanceof Error ? err.message : t('errors.send'));
        // Rethrow: the composer keeps the text so the user can retry it.
        throw err;
      }
      // Bubbles are rendered from the stream alone — the server echoes this
      // message back on our own stream, so there is nothing to append here and
      // no duplicate to reconcile. With no stream there is no echo either, so
      // close that gap the same way a reconnect does: refetch.
      if (stream.status !== 'live') {
        await refresh().catch(() => {
          // already surfaced as the page-level error
        });
      }
    },
    [threadId, stream.status, refresh, t]
  );

  return (
    <DashboardContent maxWidth="md">
      <PageHeader
        title={counterpart ?? t('thread.title')}
        titleVariant="h5"
        backHref={paths.dashboard.market.chat}
        subtitle={t(`stream.${stream.status}`)}
        action={
          thread && (
            <Link
              variant="body2"
              component={RouterLink}
              href={paths.dashboard.market.order(thread.order_id)}
            >
              {t('thread.viewOrder')}
            </Link>
          )
        }
      />

      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Card sx={{ display: 'flex', flexDirection: 'column', height: { xs: 480, md: 560 } }}>
          <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
            {loading && messages.length === 0 && (
              <Stack spacing={2}>
                {[...Array(4)].map((_, index) => (
                  <Skeleton key={index} height={48} />
                ))}
              </Stack>
            )}

            <Stack spacing={2}>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  mine={message.sender_user_id === user?.id}
                />
              ))}
            </Stack>

            {!loading && messages.length === 0 && (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h6">{t('thread.emptyTitle')}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                  {t('thread.emptySubtitle')}
                </Typography>
              </Box>
            )}

            <Box ref={bottomRef} />
          </Box>

          <Divider />

          <MessageComposer onSend={handleSend} />
        </Card>
      </Stack>

      <ErrorDialog
        open={!!sendError}
        message={sendError ?? ''}
        title={t('errors.sendTitle')}
        onClose={() => setSendError(null)}
      />
    </DashboardContent>
  );
}
