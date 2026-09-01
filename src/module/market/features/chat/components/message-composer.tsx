import { useState } from 'react';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

// ----------------------------------------------------------------------

/** Contract: body is 1..2000 chars. */
const MAX_BODY = 2000;

type Props = {
  /** Rejects when the send failed — the text stays put so the user can retry. */
  onSend: (body: string) => Promise<void>;
};

export function MessageComposer({ onSend }: Props) {
  const { t } = useTranslate('chat');

  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);

  const body = value.trim();
  const canSend = !!body && body.length <= MAX_BODY && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      await onSend(body);
      setValue('');
    } catch {
      // Reported by the caller's error dialog; keep what was typed.
    } finally {
      setSending(false);
    }
  };

  return (
    <Stack direction="row" spacing={1} sx={{ p: 2, alignItems: 'flex-end' }}>
      <TextField
        fullWidth
        multiline
        maxRows={4}
        size="small"
        value={value}
        placeholder={t('composer.placeholder')}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
          }
        }}
        error={body.length > MAX_BODY}
        helperText={body.length > MAX_BODY ? t('composer.tooLong', { max: MAX_BODY }) : undefined}
      />

      <IconButton
        color="primary"
        disabled={!canSend}
        onClick={handleSend}
        aria-label={t('composer.send')}
        sx={{ mb: 0.5 }}
      >
        <Iconify icon="custom:send-fill" />
      </IconButton>
    </Stack>
  );
}
