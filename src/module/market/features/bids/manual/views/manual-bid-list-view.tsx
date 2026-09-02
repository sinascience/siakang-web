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

import { manualBidDetailPath } from '../routes';
import { useManualBidList } from '../hooks/use-manual-bid-list';
import { ManualBidTableRow } from '../components/manual-bid-table-row';
import { CreateManualBidDialog } from '../components/create-manual-bid-dialog';

// ----------------------------------------------------------------------

export function ManualBidListView() {
  const { t } = useTranslate('bids-manual');
  const { t: tCommon } = useTranslate('common');
  const router = useRouter();

  const table = useTable({ defaultRowsPerPage: 25, defaultDense: true });
  const [createOpen, setCreateOpen] = useState(false);

  const TABLE_HEAD = useMemo(
    () => [
      { id: 'job', label: t('list.table.job') },
      { id: 'budget', label: t('list.table.budget'), align: 'right' as const },
      { id: 'offers', label: t('list.table.offers'), align: 'right' as const },
      { id: 'date', label: t('list.table.date') },
      { id: 'status', label: t('list.table.status') },
    ],
    [t]
  );

  const listParams = useMemo(
    () => ({ page: table.page + 1, limit: table.rowsPerPage }),
    [table.page, table.rowsPerPage]
  );

  const { data, meta, loading, error, refresh } = useManualBidList(listParams);

  const onView = useCallback(
    (id: string) => router.push(manualBidDetailPath(id)),
    [router]
  );

  const showSkeletons = loading && data.length === 0;
  const isEmpty = !loading && data.length === 0;

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title={t('list.title')}
        subtitle={t('list.subtitle')}
        action={
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="mingcute:add-line" width={18} />}
            onClick={() => setCreateOpen(true)}
          >
            {t('list.postAction')}
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
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
              <TableHeadCustom headCells={TABLE_HEAD} />
              <TableBody>
                {showSkeletons && (
                  <TableSkeleton rowCount={table.rowsPerPage} cellCount={TABLE_HEAD.length} />
                )}

                {data.map((row) => (
                  <ManualBidTableRow key={row.id} row={row} onView={onView} />
                ))}

                {isEmpty && (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEAD.length}>
                      <Box sx={{ py: 8, textAlign: 'center' }}>
                        <Iconify
                          width={48}
                          icon="solar:wad-of-money-bold"
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

      <CreateManualBidDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(bid) => {
          setCreateOpen(false);
          toast.success(t('list.postSuccess'));
          refresh();
          router.push(manualBidDetailPath(bid.id));
        }}
      />
    </DashboardContent>
  );
}
