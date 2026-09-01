import type { CardProps } from '@mui/material/Card';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

import { formatIdr } from '../utils/format';

// ----------------------------------------------------------------------

type Props = CardProps & {
  balanceIdr: number | null;
  loading: boolean;
};

export function WalletBalanceCard({ balanceIdr, loading, sx, ...other }: Props) {
  const { t } = useTranslate('wallet');

  const firstLoad = loading && balanceIdr === null;

  return (
    <Card sx={[{ p: 3 }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Stack
          sx={{
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: '50%',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'primary.main',
            bgcolor: 'primary.lighter',
          }}
        >
          <Iconify icon="solar:wad-of-money-bold" width={24} />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('balance.label')}
          </Typography>

          {firstLoad ? (
            <Skeleton variant="text" width={160} height={36} />
          ) : (
            <Typography variant="h4">{formatIdr(balanceIdr ?? 0)}</Typography>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
