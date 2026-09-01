import type { Order } from '../types';
import type { LabelColor } from 'src/shared/ui/label';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { fDateTime } from 'src/shared/utils';
import { Iconify } from 'src/shared/ui/iconify';
import { Scrollbar } from 'src/shared/ui/scrollbar';
import { PageHeader } from 'src/shared/ui/page-header';
import { DashboardContent } from 'src/layouts/dashboard';
import { useTable, TableHeadCustom } from 'src/shared/ui/table';

import { useOrder } from '../hooks/use-order';
import { OrderStatusLabel } from '../components/order-status-label';
import { useConfirmCountdown } from '../hooks/use-confirm-countdown';
import { formatIdr, formatOrderCode, formatCountdownClock } from '../utils/format';

// ----------------------------------------------------------------------

export function OrderDetailView() {
  const { id } = useParams();
  const { t } = useTranslate('orders');
  const { t: tCommon } = useTranslate('common');

  const { data: order, loading, notFound, error } = useOrder(id);

  const backHref = paths.dashboard.market.orders;

  if (loading) {
    return (
      <DashboardContent maxWidth="lg">
        <PageHeader backHref={backHref} backLabel={t('detail.backToList')} />
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
          <Skeleton variant="rounded" height={360} />
          <Stack spacing={3}>
            <Skeleton variant="rounded" height={160} />
            <Skeleton variant="rounded" height={160} />
          </Stack>
        </Box>
      </DashboardContent>
    );
  }

  if (notFound || !order) {
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

  const showCountdown = order.status === 'awaiting_confirmation' && !!order.confirm_deadline_at;

  return (
    <DashboardContent maxWidth="lg">
      <PageHeader
        backHref={backHref}
        backLabel={t('detail.backToList')}
        title={formatOrderCode(order.id)}
        titleVariant="h5"
        subtitle={t(`sources.${order.source}`)}
        action={<OrderStatusLabel status={order.status} variant="filled" />}
      />

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
        }}
      >
        <OrderItemsCard order={order} />

        <Stack spacing={3}>
          {showCountdown && <OrderConfirmCountdownCard order={order} />}
          <OrderSummaryCard order={order} />
          <OrderPartiesCard order={order} />
          <OrderPaymentsCard order={order} />
        </Stack>
      </Box>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function OrderItemsCard({ order }: { order: Order }) {
  const { t } = useTranslate('orders');
  const table = useTable({ defaultDense: true });

  const headCells = [
    { id: 'item', label: t('items.name') },
    { id: 'qty', label: t('items.qty'), align: 'right' as const },
    { id: 'price', label: t('items.unitPrice'), align: 'right' as const },
    { id: 'subtotal', label: t('items.subtotal'), align: 'right' as const },
    { id: 'status', label: t('items.status') },
  ];

  return (
    <Card>
      <CardHeader title={t('items.title')} />

      <TableContainer sx={{ mt: 1 }}>
        <Scrollbar>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 640 }}>
            <TableHeadCustom headCells={headCells} />
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Typography variant="body2">{item.name}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{item.quantity}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" noWrap>
                      {formatIdr(item.unit_price_idr)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" noWrap>
                      {formatIdr(item.subtotal_idr)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Label variant="soft" color={item.status === 'paid' ? 'success' : 'default'}>
                      {t(`itemStatuses.${item.status}`)}
                    </Label>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Stack spacing={1.5} sx={{ p: 3, alignItems: 'flex-end' }}>
        <TotalRow label={t('totals.total')} value={formatIdr(order.total_idr)} />
        <TotalRow label={t('totals.paid')} value={formatIdr(order.paid_idr)} />
        <TotalRow
          label={t('totals.outstanding')}
          value={formatIdr(order.outstanding_idr)}
          strong
        />
      </Stack>
    </Card>
  );
}

function TotalRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Stack direction="row" spacing={4} sx={{ width: 1, maxWidth: 320 }}>
      <Typography
        variant={strong ? 'subtitle1' : 'body2'}
        sx={{ flex: 1, color: strong ? 'text.primary' : 'text.secondary' }}
      >
        {label}
      </Typography>
      <Typography variant={strong ? 'subtitle1' : 'body2'}>{value}</Typography>
    </Stack>
  );
}

// ----------------------------------------------------------------------

const DELIVERY_COLOR: Record<Order['delivery_status'], LabelColor> = {
  none: 'default',
  preparing: 'info',
  shipped: 'primary',
  delivered: 'success',
};

function OrderSummaryCard({ order }: { order: Order }) {
  const { t } = useTranslate('orders');
  const { t: tCommon } = useTranslate('common');

  return (
    <Card>
      <CardHeader title={t('detail.summaryTitle')} />
      {/* Status lives in the page header — not repeated here. */}
      <Stack spacing={2} sx={{ p: 3 }}>
        <InfoRow label={t('detail.orderDate')} value={fDateTime(order.created_at)} />
        <InfoRow
          label={t('detail.deliveryStatus')}
          value={
            <Label variant="soft" color={DELIVERY_COLOR[order.delivery_status]}>
              {t(`deliveryStatuses.${order.delivery_status}`)}
            </Label>
          }
        />
        {order.status === 'completed' && (
          <InfoRow
            label={t('detail.completedAt')}
            value={
              <Stack spacing={0.25} sx={{ alignItems: 'flex-end' }}>
                <Typography variant="body2">
                  {order.completed_at ? fDateTime(order.completed_at) : tCommon('state.emptyDash')}
                </Typography>
                {/* auto_confirmed distinguishes "the customer confirmed" from "the window
                    elapsed" — labelled honestly, never rendered as if someone clicked. */}
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {order.auto_confirmed ? t('detail.autoConfirmed') : t('detail.customerConfirmed')}
                </Typography>
              </Stack>
            }
          />
        )}
      </Stack>
    </Card>
  );
}

function OrderPartiesCard({ order }: { order: Order }) {
  const { t } = useTranslate('orders');

  return (
    <Card>
      <CardHeader title={t('detail.partiesTitle')} />
      <Stack spacing={2} sx={{ p: 3 }}>
        <InfoRow label={t('detail.customerName')} value={order.customer.full_name} />
        <InfoRow
          label={t('detail.lapakName')}
          value={
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <Typography variant="body2">{order.lapak.name}</Typography>
              <Iconify icon="eva:star-fill" width={14} sx={{ color: 'warning.main' }} />
              <Typography variant="body2">{order.lapak.rating.toFixed(1)}</Typography>
            </Stack>
          }
        />
      </Stack>
    </Card>
  );
}

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

// ----------------------------------------------------------------------

function OrderPaymentsCard({ order }: { order: Order }) {
  const { t } = useTranslate('orders');

  return (
    <Card>
      <CardHeader title={t('payments.title')} />

      {order.payments.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', p: 3, pt: 1 }}>
          {t('payments.empty')}
        </Typography>
      ) : (
        // MORE THAN ONE payment against one order id is normal (e.g. a gig
        // order that was upsold) — always rendered as a list, never as "the
        // payment".
        <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />} sx={{ px: 3, pb: 1 }}>
          {order.payments.map((payment) => {
            const coveredItems = payment.order_item_ids
              .map((itemId) => order.items.find((item) => item.id === itemId)?.name)
              .filter((name): name is string => !!name)
              .join(', ');

            return (
              <Stack key={payment.id} spacing={0.25} sx={{ py: 1.5 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography variant="body2">{fDateTime(payment.paid_at)}</Typography>
                  <Typography variant="subtitle2">{formatIdr(payment.amount_idr)}</Typography>
                </Stack>
                {coveredItems && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {coveredItems}
                  </Typography>
                )}
              </Stack>
            );
          })}
        </Stack>
      )}
    </Card>
  );
}

// ----------------------------------------------------------------------

function OrderConfirmCountdownCard({ order }: { order: Order }) {
  const { t } = useTranslate('orders');
  const { remainingMs, expired } = useConfirmCountdown(
    order.confirm_deadline_at,
    order.status === 'awaiting_confirmation'
  );

  return (
    <Card sx={{ p: 3, textAlign: 'center' }}>
      <Iconify
        width={32}
        icon="solar:clock-circle-bold"
        sx={{ color: expired ? 'text.disabled' : 'warning.main', mb: 1 }}
      />
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {t('detail.confirmCountdownLabel')}
      </Typography>
      {expired ? (
        // Backend sweeper runs ~every 10s — a briefly-past deadline while the
        // order is still `awaiting_confirmation` is expected, not a bug. Never
        // render negative time; show an elapsed state instead.
        <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
          {t('detail.confirmDeadlinePassed')}
        </Typography>
      ) : (
        <Typography variant="h4" sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
          {formatCountdownClock(remainingMs)}
        </Typography>
      )}
    </Card>
  );
}
