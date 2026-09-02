import type { BidOffer } from '../../types';
import type { LabelColor } from 'src/shared/ui/label';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { fDateTime } from 'src/shared/utils';
import { Iconify } from 'src/shared/ui/iconify';
import { formatIdr } from 'src/module/market/features/orders/utils/format';

// ----------------------------------------------------------------------

const OFFER_STATUS_COLOR: Record<BidOffer['status'], LabelColor> = {
  pending: 'default',
  awarded: 'success',
  rejected: 'error',
};

const OFFER_STATUS_KEY: Record<BidOffer['status'], string> = {
  pending: 'offers.statusPending',
  awarded: 'offers.statusAwarded',
  rejected: 'offers.statusRejected',
};

type Props = {
  offer: BidOffer;
  /** Offers arrive cheapest-first from the contract — this just flags row 0. */
  cheapest: boolean;
  /** False once the bid has left `open` — no more awarding possible. */
  canAward: boolean;
  onAward: (offer: BidOffer) => void;
};

export function BidOfferCard({ offer, cheapest, canAward, onAward }: Props) {
  const { t } = useTranslate('bids-manual');

  return (
    <Card variant="outlined" sx={{ p: 2.5 }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" noWrap>
              {offer.lapak.name}
            </Typography>
            <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center' }}>
              <Iconify icon="eva:star-fill" width={14} sx={{ color: 'warning.main' }} />
              <Typography variant="caption">{offer.lapak.rating.toFixed(1)}</Typography>
            </Stack>
            {cheapest && (
              <Label color="success" variant="soft">
                {t('offers.cheapestBadge')}
              </Label>
            )}
          </Stack>

          <Typography variant="h6">{formatIdr(offer.amount_idr)}</Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {offer.message || t('offers.noMessage')}
          </Typography>

          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {fDateTime(offer.created_at)}
          </Typography>
        </Stack>

        <Stack spacing={1} sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
          <Label color={OFFER_STATUS_COLOR[offer.status]} variant="soft">
            {t(OFFER_STATUS_KEY[offer.status])}
          </Label>

          {canAward && offer.status === 'pending' && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="solar:shield-check-bold" width={16} />}
              onClick={() => onAward(offer)}
            >
              {t('offers.awardAction')}
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
