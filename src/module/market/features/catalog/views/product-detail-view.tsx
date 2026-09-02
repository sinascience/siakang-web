import type { Order } from 'src/module/market/features/orders/types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
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

import { useProduct } from '../hooks/use-product';

// ----------------------------------------------------------------------
// Checkout — order the product, then pay from the wallet. No confirmation
// step, no address form, no delivery selector: none are in the contract or
// the acceptance criteria. Quantity is fixed at 1 here — the contract allows
// more, but nothing in scope needs a stepper UI for it.
// ponytail: quantity always 1; add a stepper if a future flow needs qty > 1.
// ----------------------------------------------------------------------

export function ProductDetailView() {
  const { id } = useParams();
  const { t } = useTranslate('catalog');
  const { t: tCommon } = useTranslate('common');
  const router = useRouter();

  const { data: product, loading, notFound, error } = useProduct(id);

  const {
    create,
    loading: creating,
    error: createError,
    clearError: clearCreateError,
  } = useCreateOrder();
  const { pay, loading: paying, error: payError, clearError: clearPayError } = usePayOrder();

  // The order created for THIS checkout attempt. Kept around so a retry after
  // a failed payment calls `pay` again on the SAME order id — creating a new
  // order per attempt would leave a trail of abandoned `pending_payment` rows.
  const [order, setOrder] = useState<Order | null>(null);

  const backHref = paths.dashboard.market.catalog;

  const handleCheckout = async () => {
    let current = order;

    if (!current) {
      if (!product) return;
      current = await create({ product_id: product.id, quantity: 1 });
      if (!current) return; // create failed — ErrorDialog below shows why
      setOrder(current);
    }

    const result = await pay(current.id);
    if (result) {
      toast.success(t('detail.paySuccess'));
      router.push(paths.dashboard.market.order(current.id));
    }
    // On failure `payError` is set — `order` stays in state so the button
    // below turns into a same-order retry instead of losing the order.
  };

  if (loading) {
    return (
      <DashboardContent maxWidth="md">
        <PageHeader backHref={backHref} backLabel={t('detail.backToList')} />
        <Skeleton variant="rounded" height={420} />
      </DashboardContent>
    );
  }

  if (notFound || !product) {
    return (
      <DashboardContent maxWidth="md">
        <PageHeader backHref={backHref} backLabel={t('detail.backToList')} />
        <Card>
          <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', py: 10, px: 3 }}>
            <Iconify
              width={64}
              icon="solar:box-minimalistic-bold"
              sx={{ color: 'text.disabled' }}
            />
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
    : t('detail.checkout', {
        amount: formatIdr(product.price_idr),
      });

  return (
    <DashboardContent maxWidth="md">
      <PageHeader backHref={backHref} backLabel={t('detail.backToList')} />

      <Card>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '360px 1fr' },
          }}
        >
          <Box
            sx={{ position: 'relative', pt: { xs: '100%', sm: 0 }, bgcolor: 'background.neutral' }}
          >
            {product.image_url ? (
              <Box
                component="img"
                src={product.image_url}
                alt={product.title}
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
                <Iconify icon="solar:box-minimalistic-bold" width={64} />
              </Box>
            )}
          </Box>

          <Stack spacing={2} sx={{ p: 3 }}>
            <Typography variant="h4">{product.title}</Typography>

            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {product.lapak.name}
              </Typography>
              <Iconify icon="eva:star-fill" width={14} sx={{ color: 'warning.main' }} />
              <Typography variant="body2">{product.lapak.rating.toFixed(1)}</Typography>
            </Stack>

            <Typography variant="h5" sx={{ color: 'primary.main' }}>
              {formatIdr(product.price_idr)}
            </Typography>

            {product.description && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {product.description}
              </Typography>
            )}

            <Box>
              <Button
                variant="contained"
                size="large"
                loading={busy}
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
