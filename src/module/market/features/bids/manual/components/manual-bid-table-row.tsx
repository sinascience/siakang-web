import type { Bid } from '../../types';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/shared/utils';
import { formatIdr } from 'src/module/market/features/orders/utils/format';

import { ManualBidStatusLabel } from './manual-bid-status-label';

// ----------------------------------------------------------------------

type Props = {
  row: Bid;
  onView: (id: string) => void;
};

export function ManualBidTableRow({ row, onView }: Props) {
  return (
    <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => onView(row.id)}>
      <TableCell>
        <Typography variant="body2" noWrap>
          {row.title}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {row.category.name}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <Typography variant="body2" noWrap>
          {formatIdr(row.budget_idr)}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <Typography variant="body2">{row.offer_count}</Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2" noWrap>
          {fDate(row.created_at)}
        </Typography>
      </TableCell>

      <TableCell>
        <ManualBidStatusLabel status={row.status} />
      </TableCell>
    </TableRow>
  );
}
