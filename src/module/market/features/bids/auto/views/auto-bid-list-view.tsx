import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
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

import { autoBidPaths } from '../routes';
import { useAutoBidList } from '../hooks/use-auto-bid-list';
import { AutoBidTableRow } from '../components/auto-bid-table-row';
import { AutoBidCreateDialog } from '../components/auto-bid-create-dialog';

// ----------------------------------------------------------------------
// No status tabs — the customer's own automatic bids are a short, low-volume
// list (one flow, no counterpart persona view here), so a flat list plus the
// status column already carries what tabs would have added. Add tabs if that
// stops holding once volume grows.
// ----------------------------------------------------------------------

export function AutoBidListView() {
  const { t } = useTranslate('bids-auto');
  const { t: tCommon } = useTranslate('common');
  const router = useRouter();

  const table = useTable({ defaultRowsPerPage: 25, defaultDense: true });
  const [createOpen, setCreateOpen] = useState(false);

  const TABLE_HEAD = useMemo(
    () => [
      { id: 'category', label: t('table.category') },
      { id: 'budget', label: t('table.budget'), align: 'right' as const },
      { id: 'worker', label: t('table.worker') },
      { id: 'status', label: t('table.status') },
      { id: 'date', label: t('table.date') },
    ],
    [t]
  );

  const listParams = useMemo(
    () => ({ page: table.page + 1, limit: table.rowsPerPage }),
    [table.page, table.rowsPerPage]
  );

  const { data, meta, loading, error, refresh } = useAutoBidList(listParams);

  const onView = useCallback((id: string) => router.push(autoBidPaths.detail(id)), [router]);

  const showSkeletons = loading && data.length === 0;
  const isEmpty = !loading && data.length === 0;

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="mingcute:add-line" width={18} />}
            onClick={() => setCreateOpen(true)}
          >
            {t('createAction')}
          </Button>
        }
      />

      <Card>
        {error && (
          <Alert severity="error" sx={{ m: 2.5 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
              <TableHeadCustom headCells={TABLE_HEAD} />
              <TableBody>
                {showSkeletons && (
                  <TableSkeleton rowCount={table.rowsPerPage} cellCount={TABLE_HEAD.length} />
                )}

                {data.map((row) => (
                  <AutoBidTableRow key={row.id} row={row} onView={onView} />
                ))}

                {isEmpty && (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEAD.length}>
                      <Box sx={{ py: 8, textAlign: 'center' }}>
                        <Iconify
                          width={48}
                          icon="solar:bill-list-bold-duotone"
                          sx={{ color: 'text.disabled', mb: 1 }}
                        />
                        <Typography variant="h6">{t('list.emptyTitle')}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                          {t('list.emptySubtitle')}
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

      <AutoBidCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(bid) => {
          setCreateOpen(false);
          toast.success(t('form.createSuccess'));
          refresh();
          router.push(autoBidPaths.detail(bid.id));
        }}
      />
    </DashboardContent>
  );
}
