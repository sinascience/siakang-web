import type { OrderListItem } from '../types';

import { useState } from 'react';

import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { CustomPopover } from 'src/shared/ui/custom-popover';

import { fDate, fAmount } from '../utils/format';
import { OrderStatusLabel } from './order-status-label';

// ----------------------------------------------------------------------

type Props = {
  row: OrderListItem;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
};

export function OrderTableRow({ row, onView, onDelete }: Props) {
  const { t } = useTranslate('demo-order');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => onView(row.id)}>
        <TableCell>
          <Typography variant="body2" noWrap>
            {row.number}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {row.customer_name}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {fDate(row.created_at)}
          </Typography>
        </TableCell>

        <TableCell align="right">
          <Typography variant="body2">{row.item_count}</Typography>
        </TableCell>

        <TableCell align="right">
          <Typography variant="body2" noWrap>
            {fAmount(row.total)}
          </Typography>
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

          <Divider sx={{ borderStyle: 'dashed' }} />

          <MenuItem
            sx={{ color: 'error.main' }}
            onClick={() => {
              handleClose();
              onDelete(row.id);
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('rowActions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
