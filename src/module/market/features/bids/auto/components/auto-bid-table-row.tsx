import type { Bid } from '../../types';

import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/shared/utils';
import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { formatIdr } from 'src/module/market/features/orders/utils/format';

import { AutoBidStatusLabel } from './auto-bid-status-label';

// ----------------------------------------------------------------------

type Props = {
  row: Bid;
  onView: (id: string) => void;
};

export function AutoBidTableRow({ row, onView }: Props) {
  const { t } = useTranslate('bids-auto');

  return (
    <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => onView(row.id)}>
      <TableCell>
        <Typography variant="body2" noWrap>
          {row.category.name}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <Typography variant="body2" noWrap>
          {formatIdr(row.budget_idr)}
        </Typography>
      </TableCell>

      <TableCell>
        {row.matched_lapak ? (
          <Stack spacing={0.25}>
            <Typography variant="body2" noWrap>
              {row.matched_lapak.name}
            </Typography>
            {row.matched_distance_km != null && (
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <Iconify icon="mingcute:location-fill" width={12} sx={{ color: 'text.disabled' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('match.distanceLabel', { km: row.matched_distance_km.toFixed(1) })}
                </Typography>
              </Stack>
            )}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            {t('list.noMatchYet')}
          </Typography>
        )}
      </TableCell>

      <TableCell>
        <AutoBidStatusLabel status={row.status} />
      </TableCell>

      <TableCell>
        <Typography variant="body2" noWrap>
          {fDate(row.created_at)}
        </Typography>
      </TableCell>
    </TableRow>
  );
}
