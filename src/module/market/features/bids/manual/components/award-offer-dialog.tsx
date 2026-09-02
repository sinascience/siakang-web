import type { Bid, BidOffer } from '../../types';

import { useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { MotionDialog } from 'src/shared/ui/animate';
import { ErrorDialog } from 'src/shared/ui/error-dialog';
import { formatIdr } from 'src/module/market/features/orders/utils/format';

import { useAwardOffer } from '../hooks/use-award-offer';
import { usePlatformConfig } from '../../hooks/use-platform-config';

// ----------------------------------------------------------------------
// Criterion, not polish: the fee (from config, never hardcoded) and the
// off-platform warning both render here, in the same step the customer
// commits — before the POST fires. `bid.off_platform_risk` is the contract's
// own signal for "no on-platform agreement exists yet"; this dialog only
// opens while that is true (Award is only offered on an `open` bid), but the
// check stays explicit rather than assumed.
// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  bid: Bid;
  offer: BidOffer | null;
  onClose: () => void;
  onAwarded: (bid: Bid) => void;
};

export function AwardOfferDialog({ open, bid, offer, onClose, onAwarded }: Props) {
  const { t } = useTranslate('bids-manual');
  const { data: config } = usePlatformConfig();
  const { award, loading, error, clearError } = useAwardOffer();

  useEffect(() => {
    if (!open) clearError();
  }, [open, clearError]);

  if (!offer) return null;

  const handleAward = async () => {
    const updated = await award(bid.id, offer.id);
    if (updated) onAwarded(updated);
  };

  return (
    <>
      <MotionDialog
        open={open}
        onClose={loading ? undefined : onClose}
        fullWidth
        maxWidth="xs"
        motionVariant="bounceInUp"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, pr: 2.5 }}>
          <Box sx={{ flex: 1 }}>{t('award.title', { lapak: offer.lapak.name })}</Box>
          <IconButton size="small" onClick={onClose} disabled={loading}>
            <Iconify icon="mingcute:close-line" width={18} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            {/* Priced from the AWARDED OFFER, never the posted budget. */}
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('award.orderTotal')}
              </Typography>
              <Typography variant="subtitle1">{formatIdr(offer.amount_idr)}</Typography>
            </Stack>

            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('award.platformFee')}
              </Typography>
              <Typography variant="subtitle1">
                {config ? formatIdr(config.bid_manual_fee_idr) : '—'}
              </Typography>
            </Stack>

            {bid.off_platform_risk && (
              <Alert
                severity="warning"
                icon={<Iconify icon="solar:danger-triangle-bold" width={20} />}
              >
                {t('award.warning')}
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:shield-check-bold" />}
            loading={loading}
            disabled={!config}
            onClick={handleAward}
          >
            {t('award.confirmAction')}
          </Button>
        </DialogActions>
      </MotionDialog>

      <ErrorDialog open={!!error} message={error ?? ''} onClose={clearError} />
    </>
  );
}
