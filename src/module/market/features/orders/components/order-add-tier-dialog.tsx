import type { Order } from '../types';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { MotionDialog } from 'src/shared/ui/animate';
import { ErrorDialog } from 'src/shared/ui/error-dialog';
import { useGigForOrder } from 'src/module/market/features/gigs/hooks/use-gig-for-order';
import { GigTierOption } from 'src/module/market/features/gigs/components/gig-tier-option';

import { useAddOrderItem } from '../hooks/use-add-order-item';

// ----------------------------------------------------------------------
// The flow-B upsell, customer side. The lapak proposes a bigger tier IN CHAT —
// there is no proposal entity and no approval step in the contract — so all
// this dialog does is let the customer pick another tier of the same gig and
// append it to the order they already have. Paying afterwards is the order's
// existing Pay action, which is what produces the second payment row.
// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  order: Order;
  onClose: () => void;
  /** Called after the item lands — the caller refreshes the order. */
  onAdded: () => void;
};

export function OrderAddTierDialog({ open, order, onClose, onAdded }: Props) {
  const { t } = useTranslate('orders');
  const { t: tCommon } = useTranslate('common');

  const { data: gig, loading: loadingGig, error: gigError } = useGigForOrder(order, open);
  const { addItem, loading: adding, error: addError, clearError } = useAddOrderItem();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) setSelectedId(null);
  }, [open]);

  // Tiers already on this order are not offered again — the customer is picking
  // what to ADD, and the whole point is a bigger tier than the one they bought.
  const ownedTierIds = order.items.map((item) => item.gig_tier_id);
  const availableTiers = (gig?.tiers ?? []).filter((tier) => !ownedTierIds.includes(tier.id));

  const handleAdd = async () => {
    if (!selectedId) return;
    const updated = await addItem(order.id, selectedId);
    if (updated) {
      toast.success(t('addTier.success'));
      onAdded();
    }
  };

  return (
    <>
      <MotionDialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, pr: 2.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {t('addTier.title')}
            </Typography>
            <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
              {gig?.title ?? t('addTier.subtitle')}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <Iconify icon="mingcute:close-line" width={18} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('addTier.hint')}
            </Typography>

            {loadingGig && <Skeleton variant="rounded" height={72} />}

            {gigError && <Alert severity="error">{gigError}</Alert>}

            {!loadingGig && !gigError && availableTiers.length === 0 && (
              <Alert severity="info">{t('addTier.noTiers')}</Alert>
            )}

            {availableTiers.map((tier) => (
              <GigTierOption
                key={tier.id}
                tier={tier}
                disabled={adding}
                selected={selectedId === tier.id}
                onSelect={setSelectedId}
              />
            ))}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            loading={adding}
            disabled={!selectedId}
            startIcon={<Iconify icon="mingcute:add-line" width={18} />}
            onClick={handleAdd}
          >
            {tCommon('actions.add')}
          </Button>
        </DialogActions>
      </MotionDialog>

      <ErrorDialog open={!!addError} message={addError ?? ''} onClose={clearError} />
    </>
  );
}
