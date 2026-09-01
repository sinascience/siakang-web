import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { fDateTime } from 'src/shared/utils';
import { PageHeader } from 'src/shared/ui/page-header';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuthContext } from 'src/module/core/features/auth/hooks';

import { useChatThreads } from '../hooks/use-chat-threads';

// ----------------------------------------------------------------------

export function ChatListView() {
  const { t } = useTranslate('chat');
  const { user } = useAuthContext();

  const { data, loading, error } = useChatThreads();

  const isEmpty = !loading && data.length === 0;

  return (
    <DashboardContent maxWidth="md">
      <PageHeader title={t('title')} />

      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Card>
          <List disablePadding>
            {loading &&
              [...Array(3)].map((_, index) => (
                <Box key={index} sx={{ px: 2, py: 1.5 }}>
                  <Skeleton height={24} />
                  <Skeleton height={20} width="60%" />
                </Box>
              ))}

            {data.map((thread, index) => {
              // Persona-neutral: the side you are not on is the one worth naming.
              // Identity comes from ids, never from a role flag.
              const counterpart =
                user?.id === thread.customer.id ? thread.lapak.name : thread.customer.full_name;

              return (
                <Box key={thread.id}>
                  {index > 0 && <Divider component="li" />}

                  <ListItemButton
                    component={RouterLink}
                    href={paths.dashboard.market.chatThread(thread.id)}
                    sx={{ py: 1.5 }}
                  >
                    <ListItemAvatar>
                      <Avatar>{counterpart.charAt(0).toUpperCase()}</Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={counterpart}
                      secondary={thread.last_message?.body ?? t('list.noMessage')}
                      slotProps={{
                        primary: { noWrap: true, variant: 'subtitle2' },
                        secondary: { noWrap: true, variant: 'body2' },
                      }}
                    />

                    <Typography
                      variant="caption"
                      sx={{ ml: 2, flexShrink: 0, color: 'text.disabled' }}
                    >
                      {fDateTime(thread.last_message?.created_at ?? thread.created_at)}
                    </Typography>
                  </ListItemButton>
                </Box>
              );
            })}

            {isEmpty && (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h6">{t('list.emptyTitle')}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                  {t('list.emptySubtitle')}
                </Typography>
              </Box>
            )}
          </List>
        </Card>
      </Stack>
    </DashboardContent>
  );
}
