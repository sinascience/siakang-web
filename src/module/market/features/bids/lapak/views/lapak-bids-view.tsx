import type { LabelColor } from 'src/shared/ui/label';
import type { Bid, BidStatus } from 'src/module/market/features/bids/types';

import { useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { Scrollbar } from 'src/shared/ui/scrollbar';
import { PageHeader } from 'src/shared/ui/page-header';
import { ErrorDialog } from 'src/shared/ui/error-dialog';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuthContext } from 'src/module/core/features/auth/hooks';
import { formatIdr } from 'src/module/market/features/orders/utils/format';
import {
  useTable,
  TableSkeleton,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/shared/ui/table';

import { useAcceptBid } from '../hooks/use-accept-bid';
import { useLapakBidList } from '../hooks/use-lapak-bid-list';
import { PlaceOfferDialog } from '../components/place-offer-dialog';

// ----------------------------------------------------------------------

type ModeTab = 'manual' | 'auto';

const AUTO_STATUS_COLOR: Record<BidStatus, LabelColor> = {
  matching: 'default',
  proposed: 'warning',
  customer_confirmed: 'info',
  accepted: 'info',
  ordered: 'success',
  no_match: 'default',
  open: 'default',
  awarded: 'default',
  cancelled: 'error',
};

export function LapakBidsView() {
  const { t } = useTranslate('bids-lapak');
  // Non-null `lapak` is the only authoritative persona signal (a customer and
  // a lapak can both carry a market role) — see docs/patterns/mock-auth.md
  // and the task's persona note. A customer landing on this screen must see
  // nothing meaningful, never a broken table.
  const { lapak } = useAuthContext();

  const [tab, setTab] = useState<ModeTab>('manual');
  const [offerBid, setOfferBid] = useState<Bid | null>(null);

  const manualTable = useTable({ defaultRowsPerPage: 10, defaultDense: true });
  const autoTable = useTable({ defaultRowsPerPage: 10, defaultDense: true });

  const manual = useLapakBidList({
    mode: 'manual',
    page: manualTable.page + 1,
    limit: manualTable.rowsPerPage,
  });
  const auto = useLapakBidList({
    mode: 'auto',
    page: autoTable.page + 1,
    limit: autoTable.rowsPerPage,
  });

  const {
    accept,
    loading: accepting,
    error: acceptError,
    clearError: clearAcceptError,
  } = useAcceptBid();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const handleRefresh = useCallback(() => {
    manual.refresh();
    auto.refresh();
  }, [manual, auto]);

  const handleAccept = useCallback(
    async (bid: Bid) => {
      setAcceptingId(bid.id);
      const updated = await accept(bid.id);
      setAcceptingId(null);
      if (updated) {
        toast.success(t('auto.acceptSuccess'));
        auto.refresh();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accept, t]
  );

  if (!lapak) {
    return (
      <DashboardContent maxWidth="lg">
        <PageHeader title={t('title')} />
        <Card>
          <Box sx={{ py: 10, px: 3, textAlign: 'center' }}>
            <Iconify
              width={56}
              icon="solar:forbidden-circle-bold"
              sx={{ color: 'text.disabled', mb: 1 }}
            />
            <Typography variant="h6">{t('guard.title')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {t('guard.subtitle')}
            </Typography>
          </Box>
        </Card>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <Tooltip title={t('refresh')}>
            <IconButton onClick={handleRefresh}>
              <Iconify icon="solar:restart-bold" width={20} />
            </IconButton>
          </Tooltip>
        }
      />

      <Card>
        <Tabs
          value={tab}
          onChange={(_, value: ModeTab) => setTab(value)}
          sx={{ px: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Tab
            value="manual"
            label={t('tabs.manual')}
            icon={
              <Label variant={tab === 'manual' ? 'filled' : 'soft'} color="default">
                {manual.meta.total}
              </Label>
            }
            iconPosition="end"
          />
          <Tab
            value="auto"
            label={t('tabs.auto')}
            icon={
              <Label variant={tab === 'auto' ? 'filled' : 'soft'} color="default">
                {auto.meta.total}
              </Label>
            }
            iconPosition="end"
          />
        </Tabs>

        {tab === 'manual' ? (
          <ManualBidsTable
            table={manualTable}
            data={manual.data}
            meta={manual.meta}
            loading={manual.loading}
            error={manual.error}
            onOffer={setOfferBid}
          />
        ) : (
          <AutoBidsTable
            table={autoTable}
            data={auto.data}
            meta={auto.meta}
            loading={auto.loading}
            error={auto.error}
            accepting={accepting}
            acceptingId={acceptingId}
            onAccept={handleAccept}
          />
        )}
      </Card>

      <PlaceOfferDialog
        open={!!offerBid}
        bid={offerBid}
        onClose={() => setOfferBid(null)}
        onPlaced={() => {
          setOfferBid(null);
          manual.refresh();
        }}
      />

      <ErrorDialog open={!!acceptError} message={acceptError ?? ''} onClose={clearAcceptError} />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

type TableShellProps = {
  table: ReturnType<typeof useTable>;
  meta: { total: number };
  loading: boolean;
  error: string | null;
};

function ManualBidsTable({
  table,
  data,
  meta,
  loading,
  error,
  onOffer,
}: TableShellProps & { data: Bid[]; onOffer: (bid: Bid) => void }) {
  const { t } = useTranslate('bids-lapak');
  const { t: tCommon } = useTranslate('common');

  const headCells = [
    { id: 'category', label: t('table.category') },
    { id: 'job', label: t('table.job') },
    { id: 'budget', label: t('table.budget'), align: 'right' as const },
    { id: 'offers', label: t('table.offers'), align: 'right' as const },
    { id: 'action', label: t('table.action'), align: 'right' as const },
  ];

  const showSkeletons = loading && data.length === 0;
  const isEmpty = !loading && data.length === 0;

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ m: 2.5 }}>
          {error}
        </Alert>
      )}

      <TableContainer>
        <Scrollbar>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
            <TableHeadCustom headCells={headCells} />
            <TableBody>
              {showSkeletons && (
                <TableSkeleton rowCount={table.rowsPerPage} cellCount={headCells.length} />
              )}

              {data.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {row.category.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {row.title}
                    </Typography>
                    {row.description && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 1,
                          overflow: 'hidden',
                        }}
                      >
                        {row.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" noWrap>
                      {formatIdr(row.budget_idr)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{row.offer_count}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Iconify icon="solar:tag-horizontal-bold-duotone" width={16} />}
                      onClick={() => onOffer(row)}
                    >
                      {t('manual.placeAction')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {isEmpty && (
                <TableRow>
                  <TableCell colSpan={headCells.length}>
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                      <Iconify
                        width={48}
                        icon="solar:bill-list-bold"
                        sx={{ color: 'text.disabled', mb: 1 }}
                      />
                      <Typography variant="h6">{t('manual.emptyTitle')}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {t('manual.emptySubtitle')}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <TablePaginationCustom
        component="div"
        page={table.page}
        count={meta.total}
        rowsPerPage={table.rowsPerPage}
        rowsPerPageOptions={[10, 25, 50]}
        onPageChange={table.onChangePage}
        onRowsPerPageChange={table.onChangeRowsPerPage}
        labelRowsPerPage={tCommon('pagination.rowsPerPage')}
      />
    </>
  );
}

// ----------------------------------------------------------------------

function AutoBidsTable({
  table,
  data,
  meta,
  loading,
  error,
  accepting,
  acceptingId,
  onAccept,
}: TableShellProps & {
  data: Bid[];
  accepting: boolean;
  acceptingId: string | null;
  onAccept: (bid: Bid) => void;
}) {
  const { t } = useTranslate('bids-lapak');
  const { t: tCommon } = useTranslate('common');

  const headCells = [
    { id: 'category', label: t('table.category') },
    { id: 'job', label: t('table.job') },
    { id: 'budget', label: t('table.budget'), align: 'right' as const },
    { id: 'distance', label: t('table.distance'), align: 'right' as const },
    { id: 'status', label: t('table.status') },
    { id: 'action', label: t('table.action'), align: 'right' as const },
  ];

  const showSkeletons = loading && data.length === 0;
  const isEmpty = !loading && data.length === 0;

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ m: 2.5 }}>
          {error}
        </Alert>
      )}

      <TableContainer>
        <Scrollbar>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
            <TableHeadCustom headCells={headCells} />
            <TableBody>
              {showSkeletons && (
                <TableSkeleton rowCount={table.rowsPerPage} cellCount={headCells.length} />
              )}

              {data.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {row.category.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {row.title}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" noWrap>
                      {formatIdr(row.budget_idr)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" noWrap>
                      {row.matched_distance_km != null
                        ? `${row.matched_distance_km.toFixed(1)} km`
                        : tCommon('state.emptyDash')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Label variant="soft" color={AUTO_STATUS_COLOR[row.status]}>
                      {t(`auto.statuses.${row.status}`)}
                    </Label>
                  </TableCell>
                  <TableCell align="right">
                    {row.status === 'customer_confirmed' && (
                      <Button
                        size="small"
                        variant="contained"
                        loading={accepting && acceptingId === row.id}
                        disabled={accepting && acceptingId !== row.id}
                        startIcon={<Iconify icon="solar:check-circle-bold" width={16} />}
                        onClick={() => onAccept(row)}
                      >
                        {t('auto.acceptAction')}
                      </Button>
                    )}
                    {row.status === 'proposed' && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('auto.waitingCustomer')}
                      </Typography>
                    )}
                    {row.status === 'ordered' && row.order_id && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        component={RouterLink}
                        href={paths.dashboard.market.order(row.order_id)}
                        startIcon={<Iconify icon="solar:eye-bold" width={16} />}
                      >
                        {t('auto.viewOrder')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {isEmpty && (
                <TableRow>
                  <TableCell colSpan={headCells.length}>
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                      <Iconify
                        width={48}
                        icon="eva:award-fill"
                        sx={{ color: 'text.disabled', mb: 1 }}
                      />
                      <Typography variant="h6">{t('auto.emptyTitle')}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {t('auto.emptySubtitle')}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <TablePaginationCustom
        component="div"
        page={table.page}
        count={meta.total}
        rowsPerPage={table.rowsPerPage}
        rowsPerPageOptions={[10, 25, 50]}
        onPageChange={table.onChangePage}
        onRowsPerPageChange={table.onChangeRowsPerPage}
        labelRowsPerPage={tCommon('pagination.rowsPerPage')}
      />
    </>
  );
}
