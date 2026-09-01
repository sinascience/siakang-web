import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { fDateTime } from 'src/shared/utils';
import { Scrollbar } from 'src/shared/ui/scrollbar';
import { PageHeader } from 'src/shared/ui/page-header';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  useTable,
  TableSkeleton,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/shared/ui/table';

import { useWallet } from '../hooks/use-wallet';
import { formatSignedIdr } from '../utils/format';
import { useWalletLedger } from '../hooks/use-wallet-ledger';
import { WalletBalanceCard } from '../components/wallet-balance-card';

// ----------------------------------------------------------------------

export function WalletView() {
  const { t } = useTranslate('wallet');
  const { t: tCommon } = useTranslate('common');

  const wallet = useWallet();
  const table = useTable({ defaultRowsPerPage: 25, defaultDense: true });

  const TABLE_HEAD = useMemo(
    () => [
      { id: 'created_at', label: t('table.createdAt'), width: 180 },
      { id: 'type', label: t('table.type') },
      { id: 'amount', label: t('table.amount'), align: 'right' as const, width: 200 },
    ],
    [t]
  );

  const listParams = useMemo(
    () => ({ page: table.page + 1, limit: table.rowsPerPage }),
    [table.page, table.rowsPerPage]
  );

  const ledger = useWalletLedger(listParams);
  const { data, meta, loading } = ledger;

  const showSkeletons = loading && data.length === 0;
  const isEmpty = !loading && data.length === 0;
  // Both hooks hit independent endpoints (GET /wallet, GET /wallet/ledger) —
  // surface whichever failed first, page-level load error stays a single Alert.
  const loadError = wallet.error ?? ledger.error;

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader title={t('title')} />

      <Stack spacing={3}>
        {loadError && <Alert severity="error">{loadError}</Alert>}

        <WalletBalanceCard balanceIdr={wallet.data?.balance_idr ?? null} loading={wallet.loading} />

        <Card>
          <TableContainer>
            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 640 }}>
                <TableHeadCustom headCells={TABLE_HEAD} />

                <TableBody>
                  {showSkeletons && (
                    <TableSkeleton rowCount={table.rowsPerPage} cellCount={TABLE_HEAD.length} />
                  )}

                  {data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Typography variant="body2">{fDateTime(row.created_at)}</Typography>
                      </TableCell>

                      <TableCell>
                        <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
                          <Label variant="soft" color={row.amount_idr < 0 ? 'error' : 'success'}>
                            {t(`types.${row.type}`)}
                          </Label>
                          {row.note && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {row.note}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>

                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{ color: row.amount_idr < 0 ? 'error.main' : 'success.main' }}
                        >
                          {formatSignedIdr(row.amount_idr)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}

                  {isEmpty && (
                    <TableRow>
                      <TableCell colSpan={TABLE_HEAD.length}>
                        <Box sx={{ py: 8, textAlign: 'center' }}>
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
      </Stack>
    </DashboardContent>
  );
}
