import type { Order } from '../types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
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
import { Iconify } from 'src/shared/ui/iconify';
import { Scrollbar } from 'src/shared/ui/scrollbar';
import { PageHeader } from 'src/shared/ui/page-header';
import { DashboardContent } from 'src/layouts/dashboard';
import { useTable, TableHeadCustom } from 'src/shared/ui/table';

import { useOrder } from '../hooks/use-order';
import { fDate, fAmount, fDateTime } from '../utils/format';
import { OrderStatusLabel } from '../components/order-status-label';

// ----------------------------------------------------------------------

export function DemoOrderDetailView() {
  const { id } = useParams();
  const { t } = useTranslate('demo-order');
  const { t: tCommon } = useTranslate('common');

  const { data: order, loading, notFound, error } = useOrder(id);

  const backHref = paths.dashboard.demo.order;

  if (loading) {
    return (
      <DashboardContent maxWidth="lg">
        <PageHeader backHref={backHref} />
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
          <Skeleton variant="rounded" height={360} />
          <Stack spacing={3}>
            <Skeleton variant="rounded" height={200} />
            <Skeleton variant="rounded" height={220} />
          </Stack>
        </Box>
      </DashboardContent>
    );
  }

  if (notFound || !order) {
    return (
      <DashboardContent maxWidth="lg">
        <PageHeader backHref={backHref} />
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
        title={order.number}
        titleVariant="h5"
        action={<OrderStatusLabel status={order.status} />}
      />

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
        }}
      >
        <OrderLinesCard order={order} />

        <Stack spacing={3}>
          <OrderSummaryCard order={order} />
          <OrderCustomerCard order={order} />
          <OrderTimelineCard order={order} />
        </Stack>
      </Box>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function OrderLinesCard({ order }: { order: Order }) {
  const { t } = useTranslate('demo-order');
  const table = useTable({ defaultDense: true });

  const headCells = [
    { id: 'product', label: t('lines.product') },
    { id: 'qty', label: t('lines.qty'), align: 'right' as const },
    { id: 'price', label: t('lines.unitPrice'), align: 'right' as const },
    { id: 'subtotal', label: t('lines.subtotal'), align: 'right' as const },
  ];

  return (
    <Card>
      <CardHeader title={t('lines.title')} />

      <TableContainer sx={{ mt: 1 }}>
        <Scrollbar>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 560 }}>
            <TableHeadCustom headCells={headCells} />
            <TableBody>
              {order.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <Typography variant="body2">{line.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {line.sku}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{line.qty}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" noWrap>
                      {fAmount(line.unit_price)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" noWrap>
                      {fAmount(line.qty * line.unit_price)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Stack spacing={1.5} sx={{ p: 3, alignItems: 'flex-end' }}>
        <TotalRow label={t('totals.subtotal')} value={fAmount(order.subtotal)} />
        <TotalRow label={t('totals.shipping')} value={fAmount(order.shipping_cost)} />
        {order.discount > 0 && (
          <TotalRow label={t('totals.discount')} value={`- ${fAmount(order.discount)}`} />
        )}
        <TotalRow label={t('totals.total')} value={fAmount(order.total)} strong />
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

function OrderSummaryCard({ order }: { order: Order }) {
  const { t } = useTranslate('demo-order');

  return (
    <Card>
      <CardHeader title={t('detail.summaryTitle')} />
      {/* Status lives in the page header — not repeated here. */}
      <Stack spacing={2} sx={{ p: 3 }}>
        <InfoRow label={t('detail.orderDate')} value={fDate(order.created_at)} />
        <InfoRow label={t('detail.lastUpdate')} value={fDateTime(order.updated_at)} />
        <InfoRow label={t('detail.paymentMethod')} value={t(`payments.${order.payment_method}`)} />
        <InfoRow label={t('detail.itemCount')} value={String(order.item_count)} />
      </Stack>
    </Card>
  );
}

function OrderCustomerCard({ order }: { order: Order }) {
  const { t } = useTranslate('demo-order');

  return (
    <Card>
      <CardHeader title={t('detail.customerTitle')} />
      <Stack spacing={2} sx={{ p: 3 }}>
        <InfoRow label={t('detail.customerName')} value={order.customer_name} />
        <InfoRow label={t('detail.email')} value={order.customer_email} />
        <InfoRow label={t('detail.phone')} value={order.customer_phone} />
        <InfoRow
          label={t('detail.shippingAddress')}
          value={`${order.shipping_address}, ${order.shipping_city}`}
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

function OrderTimelineCard({ order }: { order: Order }) {
  const { t } = useTranslate('demo-order');

  // Hand-rolled timeline: a dot per event with a connector drawn on every item
  // except the last one.
  return (
    <Card>
      <CardHeader title={t('detail.timelineTitle')} />
      <Stack sx={{ p: 3, pt: 2 }}>
        {order.timeline.map((event, index) => {
          const isLast = index === order.timeline.length - 1;
          return (
            <Stack key={event.at} direction="row" spacing={2}>
              <Stack sx={{ alignItems: 'center', width: 12, flexShrink: 0 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    mt: 0.75,
                    borderRadius: '50%',
                    bgcolor: isLast ? 'primary.main' : 'text.disabled',
                  }}
                />
                {!isLast && <Box sx={{ width: '2px', flex: 1, my: 0.5, bgcolor: 'divider' }} />}
              </Stack>

              <Box sx={{ pb: isLast ? 0 : 2.5 }}>
                <Typography variant="body2">{t(`statuses.${event.status}`)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {fDateTime(event.at)}
                </Typography>
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Card>
  );
}
