import type { Gig } from '../types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { formatIdr } from 'src/module/market/features/orders/utils/format';

// ----------------------------------------------------------------------

type Props = {
  gig: Gig;
};

export function GigCard({ gig }: Props) {
  const { t } = useTranslate('gigs');

  // Tiers arrive price-ascending per the contract, so the first one is the
  // cheapest — the entry point the customer is meant to buy first.
  const cheapest = gig.tiers[0];

  return (
    <Card>
      <CardActionArea component={RouterLink} href={paths.dashboard.market.gig(gig.id)}>
        <Box sx={{ position: 'relative', pt: '100%', bgcolor: 'background.neutral' }}>
          {gig.image_url ? (
            <Box
              component="img"
              src={gig.image_url}
              alt={gig.title}
              sx={{ position: 'absolute', inset: 0, width: 1, height: 1, objectFit: 'cover' }}
            />
          ) : (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.disabled',
              }}
            >
              <Iconify icon="solar:case-minimalistic-bold" width={48} />
            </Box>
          )}
        </Box>

        <Stack spacing={0.75} sx={{ p: 2 }}>
          <Typography variant="subtitle1" noWrap>
            {gig.title}
          </Typography>

          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Typography variant="caption" noWrap sx={{ flex: 1, color: 'text.secondary' }}>
              {gig.lapak.name}
            </Typography>
            <Iconify
              icon="eva:star-fill"
              width={14}
              sx={{ color: 'warning.main', flexShrink: 0 }}
            />
            <Typography variant="caption" sx={{ flexShrink: 0 }}>
              {gig.lapak.rating.toFixed(1)}
            </Typography>
          </Stack>

          <Typography variant="subtitle1" sx={{ color: 'primary.main' }}>
            {cheapest ? t('card.startingFrom', { amount: formatIdr(cheapest.price_idr) }) : '—'}
          </Typography>
        </Stack>
      </CardActionArea>
    </Card>
  );
}
