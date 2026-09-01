import type { ItemDataset } from '../api';
import type { Item, ItemCategory } from '../types';

import { useMemo, useState, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

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

import { ITEM_CATEGORIES } from '../types';
import { useItemList } from '../hooks/use-item-list';
import { deleteItem, importSampleItems } from '../api';
import { useItemDialog } from '../hooks/use-item-dialog';
import { ItemTableRow } from '../components/item-table-row';
import { ItemFormDialog } from '../components/item-form-dialog';
import { ItemEmptyState } from '../components/item-empty-state';
import { ItemDetailDialog } from '../components/item-detail-dialog';

// ----------------------------------------------------------------------

type Props = {
  dataset?: ItemDataset;
  title?: string;
};

export function DemoItemListView({ dataset = 'default', title }: Props) {
  const { t } = useTranslate('demo');
  const { t: tCommon } = useTranslate('common');

  const dialog = useItemDialog();
  const table = useTable({ defaultRowsPerPage: 25, defaultDense: true });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ItemCategory | ''>('');
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const TABLE_HEAD = useMemo(
    () => [
      { id: 'code', label: t('table.code') },
      { id: 'name', label: t('table.name') },
      { id: 'category', label: t('table.category') },
      { id: 'price', label: t('table.price') },
      { id: 'stock', label: t('table.stock') },
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
      category,
    }),
    [table.page, table.rowsPerPage, search, category]
  );

  const { data, meta, loading, error, refresh } = useItemList(dataset, listParams);

  const selectedItem = useMemo(
    () => (dialog.id ? (data.find((it) => it.id === dialog.id) ?? null) : null),
    [dialog.id, data]
  );

  const handleSaved = useCallback(
    (saved: Item) => {
      refresh();
      dialog.close();
      toast.success(t('feedback.saved', { name: saved.name }));
    },
    [dialog, refresh, t]
  );

  const onView = useCallback((id: string) => dialog.open('view', id), [dialog]);
  const onEdit = useCallback((id: string) => dialog.open('edit', id), [dialog]);

  const onDelete = useCallback(
    (id: string) => {
      const it = data.find((row) => row.id === id);
      if (it) setDeleteTarget(it);
    },
    [data]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteItem(dataset, deleteTarget.id);
      refresh();
      setDeleteTarget(null);
      dialog.close();
      toast.success(t('feedback.deleted'));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t('errors.deleteFailed'));
    } finally {
      setActionLoading(false);
    }
  }, [deleteTarget, dataset, refresh, dialog, t]);

  const handleImport = useCallback(async () => {
    setImporting(true);
    try {
      const { imported } = await importSampleItems(dataset);
      refresh();
      toast.success(t('feedback.imported', { count: imported }));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t('errors.saveFailed'));
    } finally {
      setImporting(false);
    }
  }, [dataset, refresh, t]);

  const showSkeletons = loading && data.length === 0;
  const isEmpty = !loading && data.length === 0;
  const hasActiveFilters = !!search || !!category;
  // Pristine empty (no rows, no filters, no error): show ONLY the empty state —
  // hide the toolbar, table header and pagination for a cleaner first-run look.
  const isPristineEmpty = isEmpty && !hasActiveFilters && !error;

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title={title ?? t('title')}
        action={
          !isPristineEmpty ? (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => dialog.open('new')}
            >
              {t('buttons.new')}
            </Button>
          ) : null
        }
      />

      <Stack spacing={3}>
        {isPristineEmpty ? (
          <Card>
            <ItemEmptyState
              onCreate={() => dialog.open('new')}
              onImport={handleImport}
              importing={importing}
            />
          </Card>
        ) : (
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
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as ItemCategory | '');
                  table.onResetPage();
                }}
                label={t('toolbar.category')}
                sx={{ width: { xs: 1, md: 220 } }}
              >
                <MenuItem value="">{t('toolbar.allCategories')}</MenuItem>
                {ITEM_CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {t(`categories.${cat}`)}
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
                      <ItemTableRow
                        key={row.id}
                        row={row}
                        onView={onView}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
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
        )}
      </Stack>

      <ItemDetailDialog
        open={dialog.mode === 'view'}
        item={dialog.mode === 'view' ? selectedItem : null}
        onClose={dialog.close}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <ItemFormDialog
        open={dialog.mode === 'new' || dialog.mode === 'edit'}
        mode={dialog.mode === 'edit' ? 'edit' : 'new'}
        dataset={dataset}
        seed={dialog.mode === 'edit' ? selectedItem : null}
        onClose={dialog.close}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('delete.title')}
        description={deleteTarget ? t('delete.message', { name: deleteTarget.name }) : ''}
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
