import type { ChatMessage } from '../types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fTime } from 'src/shared/utils';

// ----------------------------------------------------------------------

type Props = {
  message: ChatMessage;
  /** Decided by `sender_user_id` vs the signed-in user's id — never by persona. */
  mine: boolean;
};

export function MessageBubble({ message, mine }: Props) {
  return (
    <Stack sx={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
      <Box
        sx={{
          px: 1.5,
          py: 1,
          maxWidth: 480,
          borderRadius: 1.5,
          typography: 'body2',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: mine ? 'primary.contrastText' : 'text.primary',
          bgcolor: mine ? 'primary.main' : 'background.neutral',
        }}
      >
        {message.body}
      </Box>

      <Typography variant="caption" sx={{ mt: 0.5, color: 'text.disabled' }}>
        {fTime(message.created_at)}
      </Typography>
    </Stack>
  );
}
