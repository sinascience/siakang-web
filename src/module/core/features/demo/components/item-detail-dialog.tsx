import type { Item } from '../types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { Iconify } from 'src/shared/ui/iconify';
import { MotionDialog } from 'src/shared/ui/animate';

// ----------------------------------------------------------------------

const priceFormatter = new Intl.NumberFormat('id-ID');

type Props = {
  open: boolean;
  item: Item | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ItemDetailDialog({ open, item, onClose, onEdit, onDelete }: Props) {
  const { t } = useTranslate('demo');
  const { t: tCommon } = useTranslate('common');

  const title = item?.name ?? t('detail.title');

  return (
    <MotionDialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, pr: 2.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" noWrap>
            {title}
          </Typography>
        </Box>
        {item && (
          <Label variant="soft" color={item.is_active ? 'success' : 'default'}>
            {t(item.is_active ? 'statuses.active' : 'statuses.inactive')}
          </Label>
        )}
        <IconButton size="small" onClick={onClose}>
          <Iconify icon="mingcute:close-line" width={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        {item && (
          <Box
            sx={{
              display: 'grid',
              gap: 2.5,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            }}
          >
            <DetailItem label={t('form.code')} value={item.code} />
            <DetailItem label={t('form.name')} value={item.name} />
            <DetailItem label={t('form.category')} value={t(`categories.${item.category}`)} />
            <DetailItem label={t('form.price')} value={`Rp ${priceFormatter.format(item.price)}`} />
            <DetailItem label={t('form.stock')} value={String(item.stock)} />
            <DetailItem
              label={t('form.status')}
              value={t(item.is_active ? 'statuses.active' : 'statuses.inactive')}
            />
            <Box sx={{ gridColumn: { md: '1 / -1' } }}>
              <DetailItem label={t('form.description')} value={item.description} />
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ gap: 1 }}>
        {item && (
          <>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={() => onDelete(item.id)}
            >
              {tCommon('actions.delete')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={() => onEdit(item.id)}
            >
              {tCommon('actions.edit')}
            </Button>
          </>
        )}
      </DialogActions>
    </MotionDialog>
  );
}

// ----------------------------------------------------------------------

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Stack>
  );
}
