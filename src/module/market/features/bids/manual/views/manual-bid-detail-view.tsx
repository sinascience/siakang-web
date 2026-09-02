import type { BidOffer } from '../../types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { fDateTime } from 'src/shared/utils';
import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { PageHeader } from 'src/shared/ui/page-header';
import { DashboardContent } from 'src/layouts/dashboard';
import { formatIdr } from 'src/module/market/features/orders/utils/format';

import { useManualBid } from '../hooks/use-manual-bid';
import { useBidOffers } from '../hooks/use-bid-offers';
import { BidOfferCard } from '../components/bid-offer-card';
import { AwardOfferDialog } from '../components/award-offer-dialog';
import { ManualBidStatusLabel } from '../components/manual-bid-status-label';

// ----------------------------------------------------------------------

export function ManualBidDetailView() {
  const { id } = useParams();
  const { t } = useTranslate('bids-manual');
  const { t: tCommon } = useTranslate('common');

  const { data: bid, loading, notFound, error, refresh } = useManualBid(id);
  const isOpen = bid?.status === 'open';

  const {
    data: offers,
    loading: offersLoading,
    refresh: refreshOffers,
  } = useBidOffers(id, isOpen);

  const [awardTarget, setAwardTarget] = useState<BidOffer | null>(null);

  const backHref = paths.dashboard.market.bidsManual;

  if (loading) {
    return (
      <DashboardContent maxWidth="lg">
        <PageHeader backHref={backHref} backLabel={t('detail.backToList')} />
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
          <Skeleton variant="rounded" height={320} />
          <Skeleton variant="rounded" height={220} />
        </Box>
      </DashboardContent>
    );
  }

  if (notFound || !bid) {
    return (
      <DashboardContent maxWidth="lg">
        <PageHeader backHref={backHref} backLabel={t('detail.backToList')} />
        <Card>
          <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', py: 10, px: 3 }}>
            <Iconify
              width={64}
              icon="solar:file-corrupted-bold-duotone"
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

  return (
    <DashboardContent maxWidth="lg">
      <PageHeader
        backHref={backHref}
        backLabel={t('detail.backToList')}
        title={bid.title}
        titleVariant="h5"
        subtitle={bid.category.name}
        action={<ManualBidStatusLabel status={bid.status} variant="filled" />}
      />

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
        }}
      >
        <Card>
          <CardHeader
            title={t('offers.title')}
            action={
              <Tooltip title={t('detail.refresh')}>
                <IconButton onClick={refreshOffers}>
                  <Iconify icon="solar:restart-bold" width={20} />
                </IconButton>
              </Tooltip>
            }
          />

          {isOpen && (
            <Typography variant="caption" sx={{ color: 'text.secondary', px: 3, display: 'block' }}>
              {t('detail.pollingHint')}
            </Typography>
          )}

          <Stack spacing={2} sx={{ p: 3, pt: 2 }}>
            {offers.length === 0 && !offersLoading && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('offers.empty')}
              </Typography>
            )}

            {offers.map((offer, index) => (
              <BidOfferCard
                key={offer.id}
                offer={offer}
                cheapest={index === 0}
                canAward={isOpen}
                onAward={setAwardTarget}
              />
            ))}
          </Stack>
        </Card>

        <Stack spacing={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              {t('detail.summaryTitle')}
            </Typography>
            <Stack spacing={2}>
              <InfoRow label={t('detail.categoryLabel')} value={bid.category.name} />
              <InfoRow label={t('detail.budgetLabel')} value={formatIdr(bid.budget_idr)} />
              <InfoRow label={t('detail.postedAt')} value={fDateTime(bid.created_at)} />
              {bid.description && (
                <Stack spacing={0.5}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {t('detail.descriptionLabel')}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {bid.description}
                  </Typography>
                </Stack>
              )}
            </Stack>

            {bid.order_id && (
              <Button
                fullWidth
                variant="contained"
                component={RouterLink}
                href={paths.dashboard.market.order(bid.order_id)}
                startIcon={<Iconify icon="solar:cart-3-bold" width={18} />}
                sx={{ mt: 3 }}
              >
                {t('detail.viewOrder')}
              </Button>
            )}
          </Card>
        </Stack>
      </Box>

      <AwardOfferDialog
        open={!!awardTarget}
        bid={bid}
        offer={awardTarget}
        onClose={() => setAwardTarget(null)}
        onAwarded={() => {
          setAwardTarget(null);
          toast.success(t('award.success'));
          refresh();
          refreshOffers();
        }}
      />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  );
}
