import type { OrderStatus, OrderListItem } from '../types';

import { useMemo, useState, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { Scrollbar } from 'src/shared/ui/scrollbar';
import { PageHeader } from 'src/shared/ui/page-header';
import { ErrorDialog } from 'src/shared/ui/error-dialog';
import { DashboardContent } from 'src/layouts/dashboard';
import { ConfirmDialog } from 'src/shared/ui/confirm-dialog';
import { SearchNotFound } from 'src/shared/ui/search-not-found';
import {
  useTable,
  TableSkeleton,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/shared/ui/table';

import { deleteOrder } from '../api';
import { ORDER_STATUSES } from '../types';
import { useOrderList } from '../hooks/use-order-list';
import { OrderTableRow } from '../components/order-table-row';

// ----------------------------------------------------------------------

export function DemoOrderListView() {
  const { t } = useTranslate('demo-order');
  const { t: tCommon } = useTranslate('common');
  const router = useRouter();

  const table = useTable({ defaultRowsPerPage: 25, defaultDense: true });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [deleteTarget, setDeleteTarget] = useState<OrderListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const TABLE_HEAD = useMemo(
    () => [
      { id: 'number', label: t('table.number') },
      { id: 'customer', label: t('table.customer') },
      { id: 'date', label: t('table.date') },
      { id: 'items', label: t('table.items'), align: 'right' as const },
      { id: 'total', label: t('table.total'), align: 'right' as const },
      { id: 'status', label: t('table.status') },
      { id: 'actions', label: '', align: 'right' as const },
    ],
    [t]
  );

  const listParams = useMemo(
    () => ({
      page: table.page + 1,
      limit: table.rowsPerPage,
      search,
      status,
    }),
    [table.page, table.rowsPerPage, search, status]
  );

  const { data, meta, loading, error, refresh } = useOrderList(listParams);

  // The whole point of this demo: detail is a route, not a dialog.
  const onView = useCallback(
    (id: string) => router.push(paths.dashboard.demo.orderDetail(id)),
    [router]
  );

  const onDelete = useCallback(
    (id: string) => {
      const order = data.find((row) => row.id === id);
      if (order) setDeleteTarget(order);
    },
    [data]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteOrder(deleteTarget.id);
      refresh();
      setDeleteTarget(null);
      toast.success(t('feedback.deleted', { number: deleteTarget.number }));
    } catch {
      setDeleteError(t('errors.deleteFailed'));
    } finally {
      setActionLoading(false);
    }
  }, [deleteTarget, refresh, t]);

  const showSkeletons = loading && data.length === 0;
  const isEmpty = !loading && data.length === 0;

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <Card>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2.5, alignItems: { md: 'center' } }}
        >
          <TextField
            fullWidth
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              table.onResetPage();
            }}
            placeholder={t('toolbar.searchPlaceholder')}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as OrderStatus | '');
              table.onResetPage();
            }}
            label={t('toolbar.status')}
            sx={{ width: { xs: 1, md: 220 } }}
          >
            <MenuItem value="">{t('toolbar.allStatuses')}</MenuItem>
            {ORDER_STATUSES.map((option) => (
              <MenuItem key={option} value={option}>
                {t(`statuses.${option}`)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Divider />

        {error && (
          <Alert severity="error" sx={{ m: 2.5 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 880 }}>
              <TableHeadCustom headCells={TABLE_HEAD} />
              <TableBody>
                {showSkeletons && (
                  <TableSkeleton rowCount={table.rowsPerPage} cellCount={TABLE_HEAD.length} />
                )}

                {data.map((row) => (
                  <OrderTableRow key={row.id} row={row} onView={onView} onDelete={onDelete} />
                ))}

                {isEmpty && (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEAD.length}>
                      <SearchNotFound query={search} sx={{ py: 8 }} />
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
          rowsPerPageOptions={[25, 50, 100]}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          labelRowsPerPage={tCommon('pagination.rowsPerPage')}
        />
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('delete.title')}
        description={deleteTarget ? t('delete.message', { number: deleteTarget.number }) : ''}
        confirmLabel={tCommon('actions.delete')}
        confirmColor="error"
        loading={actionLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <ErrorDialog
        open={!!deleteError}
        message={deleteError ?? ''}
        onClose={() => setDeleteError(null)}
      />
    </DashboardContent>
  );
}
