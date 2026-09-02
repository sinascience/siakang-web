import type { OrderStatus } from '../types';
import type { LabelColor } from 'src/shared/ui/label';

import { useMemo, useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { Iconify } from 'src/shared/ui/iconify';
import { Scrollbar } from 'src/shared/ui/scrollbar';
import { PageHeader } from 'src/shared/ui/page-header';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  useTable,
  TableSkeleton,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/shared/ui/table';

import { useOrderList } from '../hooks/use-order-list';
import { OrderTableRow } from '../components/order-table-row';

// ----------------------------------------------------------------------

type StatusTab = OrderStatus | 'all';

const STATUS_TABS: { value: StatusTab; color: LabelColor }[] = [
  { value: 'all', color: 'default' },
  { value: 'pending_payment', color: 'warning' },
  { value: 'paid', color: 'info' },
  { value: 'awaiting_confirmation', color: 'primary' },
  { value: 'completed', color: 'success' },
  { value: 'cancelled', color: 'error' },
];

export function OrdersListView() {
  const { t } = useTranslate('orders');
  const { t: tCommon } = useTranslate('common');
  const router = useRouter();

  const table = useTable({ defaultRowsPerPage: 25, defaultDense: true });
  const [statusTab, setStatusTab] = useState<StatusTab>('all');

  const TABLE_HEAD = useMemo(
    () => [
      { id: 'order', label: t('table.order') },
      { id: 'date', label: t('table.date') },
      { id: 'customer', label: t('table.customer') },
      { id: 'lapak', label: t('table.lapak') },
      { id: 'total', label: t('table.total'), align: 'right' as const },
      { id: 'status', label: t('table.status') },
    ],
    [t]
  );

  const listParams = useMemo(
    () => ({
      page: table.page + 1,
      limit: table.rowsPerPage,
      status: statusTab === 'all' ? ('' as const) : statusTab,
    }),
    [table.page, table.rowsPerPage, statusTab]
  );

  const { data, meta, loading, error } = useOrderList(listParams);
  const counts = meta.counts;

  const handleFilterStatus = useCallback(
    (value: StatusTab) => {
      setStatusTab(value);
      table.onResetPage();
    },
    [table]
  );

  const onView = useCallback(
    (id: string) => router.push(paths.dashboard.market.order(id)),
    [router]
  );

  const showSkeletons = loading && data.length === 0;
  const isEmpty = !loading && data.length === 0;

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <Card>
        <Tabs
          value={statusTab}
          onChange={(_, value: StatusTab) => handleFilterStatus(value)}
          sx={{ px: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          {STATUS_TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={t(`statuses.${tab.value}`)}
              icon={
                <Label variant={tab.value === statusTab ? 'filled' : 'soft'} color={tab.color}>
                  {(tab.value === 'all' ? counts?.all : counts?.[tab.value]) ?? 0}
                </Label>
              }
              iconPosition="end"
            />
          ))}
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ m: 2.5 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom headCells={TABLE_HEAD} />
              <TableBody>
                {showSkeletons && (
                  <TableSkeleton rowCount={table.rowsPerPage} cellCount={TABLE_HEAD.length} />
                )}

                {data.map((row) => (
                  <OrderTableRow key={row.id} row={row} onView={onView} />
                ))}

                {isEmpty && (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEAD.length}>
                      <Box sx={{ py: 8, textAlign: 'center' }}>
                        <Iconify
                          width={48}
                          icon="solar:cart-3-bold"
                          sx={{ color: 'text.disabled', mb: 1 }}
                        />
                        <Typography variant="h6">
                          {statusTab === 'all'
                            ? t('list.emptyTitle')
                            : t('list.emptyFilteredTitle')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                          {statusTab === 'all'
                            ? t('list.emptySubtitle')
                            : t('list.emptyFilteredSubtitle')}
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
          rowsPerPageOptions={[25, 50, 100]}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          labelRowsPerPage={tCommon('pagination.rowsPerPage')}
        />
      </Card>
    </DashboardContent>
  );
}
