import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { PageHeader } from 'src/shared/ui/page-header';
import { DashboardContent } from 'src/layouts/dashboard';

import { GigCard } from '../components/gig-card';
import { useGigList } from '../hooks/use-gig-list';

// ----------------------------------------------------------------------
// Card grid, same as the catalog — a browse surface, not a data table.
// ----------------------------------------------------------------------

const GRID_COLUMNS = { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' };
const PAGE_SIZE = 12;

export function GigListView() {
  const { t } = useTranslate('gigs');

  const [page, setPage] = useState(1);
  const listParams = useMemo(() => ({ page, limit: PAGE_SIZE }), [page]);
  const { data, meta, loading, error } = useGigList(listParams);

  const showSkeletons = loading && data.length === 0;
  const isEmpty = !loading && data.length === 0;

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!error && (
        <>
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: GRID_COLUMNS }}>
            {showSkeletons &&
              Array.from({ length: 8 }).map((_, index) => (
                 
                <Skeleton key={index} variant="rounded" sx={{ pt: '150%' }} />
              ))}

            {data.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </Box>

          {isEmpty && (
            <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center', py: 10 }}>
              <Iconify width={64} icon="solar:case-minimalistic-bold" sx={{ color: 'text.disabled' }} />
              <Typography variant="h6">{t('list.emptyTitle')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('list.emptySubtitle')}
              </Typography>
            </Stack>
          )}

          {meta.total_pages > 1 && (
            <Stack sx={{ alignItems: 'center', mt: 4 }}>
              <Pagination
                page={page}
                count={meta.total_pages}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Stack>
          )}
        </>
      )}
    </DashboardContent>
  );
}
