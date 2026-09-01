import type { Item } from '../types';

import { useState } from 'react';

import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { Iconify } from 'src/shared/ui/iconify';
import { CustomPopover } from 'src/shared/ui/custom-popover';

// ----------------------------------------------------------------------

const priceFormatter = new Intl.NumberFormat('id-ID');

type Props = {
  row: Item;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ItemTableRow({ row, onView, onEdit, onDelete }: Props) {
  const { t } = useTranslate('demo');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => onView(row.id)}>
        <TableCell>
          <Typography variant="body2" noWrap>
            {row.code}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {row.name}
          </Typography>
        </TableCell>

        <TableCell>
          <Label color="default" variant="soft">
            {t(`categories.${row.category}`)}
          </Label>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            Rp {priceFormatter.format(row.price)}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{row.stock}</Typography>
        </TableCell>

        <TableCell>
          <Label color={row.is_active ? 'success' : 'default'} variant="soft">
            {row.is_active ? t('statuses.active') : t('statuses.inactive')}
          </Label>
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

          <MenuItem
            onClick={() => {
              handleClose();
              onEdit(row.id);
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {t('rowActions.edit')}
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
