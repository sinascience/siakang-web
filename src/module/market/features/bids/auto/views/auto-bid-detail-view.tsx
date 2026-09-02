import type { Bid } from '../../types';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { fDateTime } from 'src/shared/utils';
import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { PageHeader } from 'src/shared/ui/page-header';
import { ErrorDialog } from 'src/shared/ui/error-dialog';
import { DashboardContent } from 'src/layouts/dashboard';
import { formatIdr } from 'src/module/market/features/orders/utils/format';

import { useAutoBid } from '../hooks/use-auto-bid';
import { useConfirmAutoBid } from '../hooks/use-confirm-auto-bid';
import { AutoBidStatusLabel } from '../components/auto-bid-status-label';

// ----------------------------------------------------------------------

export function AutoBidDetailView() {
  const { id } = useParams();
  const { t } = useTranslate('bids-auto');
  const { t: tCommon } = useTranslate('common');

  const { data: bid, loading, notFound, error, refresh } = useAutoBid(id);
  const {
    confirm,
    loading: confirming,
    error: confirmError,
    clearError: clearConfirmError,
  } = useConfirmAutoBid();

  const backHref = paths.dashboard.market.bidsAuto;

  const handleConfirm = async () => {
    if (!bid) return;
    const updated = await confirm(bid.id);
    if (updated) {
      toast.success(t('match.confirmSuccess'));
      refresh();
    }
  };

  if (loading) {
    return (
      <DashboardContent maxWidth="sm">
        <PageHeader backHref={backHref} backLabel={t('detail.backToList')} />
        <Skeleton variant="rounded" height={280} />
      </DashboardContent>
    );
  }

  if (notFound || !bid) {
    return (
      <DashboardContent maxWidth="sm">
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
    <DashboardContent maxWidth="sm">
      <PageHeader
        backHref={backHref}
        backLabel={t('detail.backToList')}
        title={bid.category.name}
        subtitle={formatIdr(bid.budget_idr)}
        action={<AutoBidStatusLabel status={bid.status} variant="filled" />}
      />

      <Stack spacing={3}>
        <AutoBidStatusCard
          bid={bid}
          confirming={confirming}
          onConfirm={handleConfirm}
          onRefresh={refresh}
        />

        <Card>
          <CardHeader title={t('detail.summaryTitle')} />
          <Stack spacing={2} sx={{ p: 3 }}>
            <InfoRow label={t('detail.budgetLabel')} value={formatIdr(bid.budget_idr)} />
            <InfoRow label={t('detail.feePaidLabel')} value={formatIdr(bid.fee_paid_idr)} />
            <InfoRow label={t('detail.createdAtLabel')} value={fDateTime(bid.created_at)} />
          </Stack>
        </Card>
      </Stack>

      <ErrorDialog open={!!confirmError} message={confirmError ?? ''} onClose={clearConfirmError} />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------
// The status-driven card — this IS the "matched proposal screen" from
// criterion 2. `order_id` is checked before `status` because the mock (and,
// per the contract, the real backend) sets both together on accept — once an
// order exists that is always the more useful thing to show, whatever the
// exact status string.
// ----------------------------------------------------------------------

function AutoBidStatusCard({
  bid,
  confirming,
  onConfirm,
  onRefresh,
}: {
  bid: Bid;
  confirming: boolean;
  onConfirm: () => void;
  onRefresh: () => void;
}) {
  const { t } = useTranslate('bids-auto');

  if (bid.order_id) {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Iconify width={32} icon="solar:check-circle-bold" sx={{ color: 'success.main', mb: 1 }} />
        <Typography variant="h6">{t('ready.title')}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {t('ready.subtitle')}
        </Typography>
        <Button
          fullWidth
          variant="contained"
          component={RouterLink}
          href={paths.dashboard.market.order(bid.order_id)}
          startIcon={<Iconify icon="eva:external-link-fill" width={18} />}
          sx={{ mt: 2 }}
        >
          {t('ready.viewOrderAction')}
        </Button>
      </Card>
    );
  }

  if (bid.status === 'no_match') {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Iconify width={32} icon="solar:danger-triangle-bold" sx={{ color: 'error.main', mb: 1 }} />
        <Typography variant="h6">{t('noMatch.title')}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {t('noMatch.subtitle')}
        </Typography>
        <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
          {t('noMatch.refundNotice')}
        </Alert>
      </Card>
    );
  }

  if (bid.status === 'proposed' && bid.matched_lapak) {
    return (
      <Card sx={{ p: 3 }}>
        <Stack spacing={0.5} sx={{ textAlign: 'center', mb: 2 }}>
          <Iconify
            width={32}
            icon="solar:user-rounded-bold"
            sx={{ color: 'primary.main', mx: 'auto' }}
          />
          <Typography variant="h6">{t('match.title')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('match.subtitle')}
          </Typography>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed', mb: 2 }} />

        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <InfoRow label={t('detail.workerLabel')} value={bid.matched_lapak.name} />
          <InfoRow
            label={t('match.ratingLabel')}
            value={
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ alignItems: 'center', justifyContent: 'flex-end' }}
              >
                <Iconify icon="eva:star-fill" width={14} sx={{ color: 'warning.main' }} />
                <Typography variant="body2">{bid.matched_lapak.rating.toFixed(1)}</Typography>
              </Stack>
            }
          />
          {bid.matched_distance_km != null && (
            <InfoRow
              label={t('detail.distanceLabel')}
              value={t('match.distanceLabel', { km: bid.matched_distance_km.toFixed(1) })}
            />
          )}
        </Stack>

        <Button
          fullWidth
          variant="contained"
          loading={confirming}
          startIcon={<Iconify icon="solar:check-circle-bold" width={18} />}
          onClick={onConfirm}
        >
          {t('match.confirmAction')}
        </Button>
      </Card>
    );
  }

  if (bid.status === 'customer_confirmed') {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={32} sx={{ mb: 1 }} />
        <Typography variant="h6">{t('waiting.title')}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {t('waiting.subtitle')}
        </Typography>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<Iconify icon="solar:restart-bold" width={18} />}
          onClick={onRefresh}
          sx={{ mt: 2 }}
        >
          {t('detail.refreshAction')}
        </Button>
      </Card>
    );
  }

  if (bid.status === 'cancelled') {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Iconify
          width={32}
          icon="solar:forbidden-circle-bold"
          sx={{ color: 'text.disabled', mb: 1 }}
        />
        <Typography variant="h6">{t('cancelled.title')}</Typography>
      </Card>
    );
  }

  // `matching` (and, defensively, `accepted`) — the mock resolves matching
  // synchronously so this should never actually render, but nothing stops a
  // real backend from returning it mid-flight.
  return (
    <Card sx={{ p: 3, textAlign: 'center' }}>
      <CircularProgress size={32} sx={{ mb: 1 }} />
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {t('statuses.matching')}
      </Typography>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<Iconify icon="solar:restart-bold" width={18} />}
        onClick={onRefresh}
        sx={{ mt: 2 }}
      >
        {t('detail.refreshAction')}
      </Button>
    </Card>
  );
}

// ----------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
    >
      <Typography variant="body2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
        {label}
      </Typography>
      {typeof value === 'string' ? (
        <Typography variant="body2" sx={{ textAlign: 'right' }}>
          {value}
        </Typography>
      ) : (
        value
      )}
    </Stack>
  );
}
