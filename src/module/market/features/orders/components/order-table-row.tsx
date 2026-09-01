import type { Order } from '../types';

import { useState } from 'react';

import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/shared/utils';
import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { CustomPopover } from 'src/shared/ui/custom-popover';

import { OrderStatusLabel } from './order-status-label';
import { formatIdr, formatOrderCode } from '../utils/format';

// ----------------------------------------------------------------------

type Props = {
  row: Order;
  onView: (id: string) => void;
};

export function OrderTableRow({ row, onView }: Props) {
  const { t } = useTranslate('orders');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => onView(row.id)}>
        <TableCell>
          <Typography variant="body2" noWrap>
            {formatOrderCode(row.id)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t(`sources.${row.source}`)}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {fDate(row.created_at)}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {row.customer.full_name}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {row.lapak.name}
          </Typography>
        </TableCell>

        <TableCell align="right">
          <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
            <Typography variant="body2" noWrap>
              {formatIdr(row.total_idr)}
            </Typography>
            {row.outstanding_idr > 0 && (
              <Typography variant="caption" sx={{ color: 'warning.main' }}>
                {t('table.outstanding', { amount: formatIdr(row.outstanding_idr) })}
              </Typography>
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <OrderStatusLabel status={row.status} />
        </TableCell>

        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={handleClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              handleClose();
              onView(row.id);
            }}
          >
            <Iconify icon="solar:eye-bold" />
            {t('rowActions.viewDetail')}
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
