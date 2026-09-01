import type { Order } from 'src/module/market/features/orders/types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useParams } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { PageHeader } from 'src/shared/ui/page-header';
import { ErrorDialog } from 'src/shared/ui/error-dialog';
import { DashboardContent } from 'src/layouts/dashboard';
import { formatIdr } from 'src/module/market/features/orders/utils/format';
import { usePayOrder } from 'src/module/market/features/orders/hooks/use-pay-order';
import { useCreateOrder } from 'src/module/market/features/orders/hooks/use-create-order';

import { useGig } from '../hooks/use-gig';
import { GigTierOption } from '../components/gig-tier-option';

// ----------------------------------------------------------------------
// Buy ONE tier — the cheapest is preselected, because flow B starts with the
// customer buying the consultation to get the lapak talking. A bigger tier is
// NOT bought here: once the lapak has diagnosed the problem in chat, the
// customer appends that tier to the SAME order from the order detail page.
//
// Checkout mirrors catalog/views/product-detail-view.tsx: create then pay, with
// the created order kept in state so a failed payment retries the SAME order id
// instead of leaving a trail of abandoned `pending_payment` rows.
// ----------------------------------------------------------------------

export function GigDetailView() {
  const { id } = useParams();
  const { t } = useTranslate('gigs');
  const { t: tCommon } = useTranslate('common');
  const router = useRouter();

  const { data: gig, loading, notFound, error } = useGig(id);

  const { create, loading: creating, error: createError, clearError: clearCreateError } =
    useCreateOrder();
  const { pay, loading: paying, error: payError, clearError: clearPayError } = usePayOrder();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const backHref = paths.dashboard.market.gigs;

  // Tiers come back price-ascending, so falling back to the first one makes the
  // consultation the default without an effect to seed state.
  const selectedTier = gig?.tiers.find((tier) => tier.id === selectedId) ?? gig?.tiers[0] ?? null;

  const handleCheckout = async () => {
    let current = order;

    if (!current) {
      if (!selectedTier) return;
      // A gig order sends `gig_tier_id` only — never a product_id, never a price.
      current = await create({ gig_tier_id: selectedTier.id });
      if (!current) return; // create failed — ErrorDialog below shows why
      setOrder(current);
    }

    const result = await pay(current.id);
    if (result) {
      toast.success(t('detail.paySuccess'));
      router.push(paths.dashboard.market.order(current.id));
    }
    // On failure `payError` is set and `order` stays put, so the button below
    // becomes a same-order retry.
  };

  if (loading) {
    return (
      <DashboardContent maxWidth="md">
        <PageHeader backHref={backHref} backLabel={t('detail.backToList')} />
        <Skeleton variant="rounded" height={480} />
      </DashboardContent>
    );
  }

  if (notFound || !gig) {
    return (
      <DashboardContent maxWidth="md">
        <PageHeader backHref={backHref} backLabel={t('detail.backToList')} />
        <Card>
          <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', py: 10, px: 3 }}>
            <Iconify width={64} icon="solar:case-minimalistic-bold" sx={{ color: 'text.disabled' }} />
            <Typography variant="h6">
              {notFound ? t('detail.notFoundTitle') : tCommon('error.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {error ?? t('detail.notFoundSubtitle')}
            </Typography>
          </Stack>
        </Card>
      </DashboardContent>
    );
  }

  const busy = creating || paying;
  const checkoutLabel = order
    ? t('detail.retryPay')
    : t('detail.checkout', { amount: selectedTier ? formatIdr(selectedTier.price_idr) : '' });

  return (
    <DashboardContent maxWidth="md">
      <PageHeader backHref={backHref} backLabel={t('detail.backToList')} />

      <Card>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '320px 1fr' } }}>
          <Box
            sx={{ position: 'relative', pt: { xs: '100%', sm: 0 }, bgcolor: 'background.neutral' }}
          >
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
                <Iconify icon="solar:case-minimalistic-bold" width={64} />
              </Box>
            )}
          </Box>

          <Stack spacing={2} sx={{ p: 3 }}>
            <Typography variant="h4">{gig.title}</Typography>

            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {gig.lapak.name}
              </Typography>
              <Iconify icon="eva:star-fill" width={14} sx={{ color: 'warning.main' }} />
              <Typography variant="body2">{gig.lapak.rating.toFixed(1)}</Typography>
            </Stack>

            {gig.description && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {gig.description}
              </Typography>
            )}

            <Divider sx={{ borderStyle: 'dashed' }} />

            <Stack spacing={0.5}>
              <Typography variant="subtitle2">{t('detail.tiersTitle')}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('detail.tiersHint')}
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              {gig.tiers.map((tier) => (
                <GigTierOption
                  key={tier.id}
                  tier={tier}
                  // Once an order exists the tier is locked in: the button below
                  // is a retry against that order, not a new purchase.
                  disabled={busy || !!order}
                  selected={selectedTier?.id === tier.id}
                  onSelect={setSelectedId}
                />
              ))}
            </Stack>

            <Box>
              <Button
                variant="contained"
                size="large"
                loading={busy}
                disabled={!selectedTier}
                startIcon={<Iconify icon="solar:wad-of-money-bold" width={18} />}
                onClick={handleCheckout}
              >
                {checkoutLabel}
              </Button>
            </Box>

            {order && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('detail.orderPendingHint')}{' '}
                <Link component={RouterLink} href={paths.dashboard.market.order(order.id)}>
                  {t('detail.viewOrder')}
                </Link>
              </Typography>
            )}
          </Stack>
        </Box>
      </Card>

      <ErrorDialog open={!!createError} message={createError ?? ''} onClose={clearCreateError} />
      <ErrorDialog open={!!payError} message={payError ?? ''} onClose={clearPayError} />
    </DashboardContent>
  );
}
