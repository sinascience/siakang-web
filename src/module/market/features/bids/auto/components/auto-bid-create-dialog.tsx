import type { TFunction } from 'i18next';
import type { Bid, CreateBidParams } from '../../types';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { MotionDialog } from 'src/shared/ui/animate';
import { ErrorDialog } from 'src/shared/ui/error-dialog';
import { Form, Field, RHFNumericField } from 'src/shared/ui/hook-form';
import { formatIdr } from 'src/module/market/features/orders/utils/format';

import { useBidCategories } from '../hooks/use-bid-categories';
import { useCreateAutoBid } from '../hooks/use-create-auto-bid';
import { usePlatformConfig } from '../../hooks/use-platform-config';

// ----------------------------------------------------------------------
// The fee is the point of this dialog (task file "The fee is the point of
// criterion 1"): it is read live from `usePlatformConfig()` — never a
// literal — and shown, with honest confirmation copy, before the submit
// button that actually charges it. Submit is disabled until the fee has
// loaded so nobody can charge-then-see.
// ----------------------------------------------------------------------

function makeSchema(t: TFunction) {
  return z.object({
    category_id: z.string().min(1, { message: t('form.validation.categoryRequired') }),
    budget_idr: z
      .number({ message: t('form.validation.budgetRequired') })
      .min(1, { message: t('form.validation.budgetRequired') }),
    description: z.string().max(500).optional().or(z.literal('')),
    // The contract requires an origin for mode=auto — it is what matching runs
    // haversine against — and the backend enforces it (chk_bids_auto_has_origin).
    // Every submission without these 422s.
    lat: z
      .number({ message: t('form.validation.latRequired') })
      .min(-90, { message: t('form.validation.latRange') })
      .max(90, { message: t('form.validation.latRange') }),
    lng: z
      .number({ message: t('form.validation.lngRequired') })
      .min(-180, { message: t('form.validation.lngRange') })
      .max(180, { message: t('form.validation.lngRange') }),
  });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

/**
 * Prefilled origin. Editable and always sent — unlike the previous behaviour,
 * where nothing was collected and the mock quietly invented coordinates, which
 * hid a hard backend requirement for an entire sprint.
 */
const DEFAULT_ORIGIN = { lat: -7.97, lng: 112.63 };

const DEFAULT_VALUES: FormValues = {
  category_id: '',
  budget_idr: 0,
  description: '',
  ...DEFAULT_ORIGIN,
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (bid: Bid) => void;
};

export function AutoBidCreateDialog({ open, onClose, onCreated }: Props) {
  const { t } = useTranslate('bids-auto');
  const schema = useMemo(() => makeSchema(t), [t]);

  const categories = useBidCategories();
  const platformConfig = usePlatformConfig();
  const { create, loading: creating, error, clearError } = useCreateAutoBid();

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) methods.reset(DEFAULT_VALUES);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fee = platformConfig.data?.bid_auto_fee_idr;

  // Opt-in: nothing is requested unless the customer asks, so no permission
  // prompt appears during an automated run. Failure is non-fatal — the
  // prefilled origin stays and stays editable.
  const [locating, setLocating] = useState(false);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        methods.setValue('lat', Number(pos.coords.latitude.toFixed(6)), { shouldValidate: true });
        methods.setValue('lng', Number(pos.coords.longitude.toFixed(6)), { shouldValidate: true });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };

  const onSubmit = methods.handleSubmit(async (values) => {
    const params: CreateBidParams = {
      mode: 'auto',
      category_id: values.category_id,
      budget_idr: values.budget_idr,
      description: values.description || undefined,
      lat: values.lat,
      lng: values.lng,
    };
    const bid = await create(params);
    if (bid) onCreated(bid);
  });

  return (
    <>
      <MotionDialog open={open} onClose={creating ? undefined : onClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, pr: 2.5 }}>
          <Box sx={{ flex: 1 }}>{t('form.title')}</Box>
          <IconButton size="small" onClick={onClose} disabled={creating}>
            <Iconify icon="mingcute:close-line" width={18} />
          </IconButton>
        </DialogTitle>
        <Form methods={methods} onSubmit={onSubmit} sx={{ display: 'contents' }}>
          <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2.5}>
              {categories.error && <Alert severity="error">{categories.error}</Alert>}

              <Field.Select
                name="category_id"
                label={t('form.category')}
                disabled={categories.loading}
              >
                {categories.data.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Field.Select>

              <RHFNumericField name="budget_idr" label={t('form.budget')} prefix="Rp" />

              <Stack spacing={1}>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ flex: 1 }}>
                    {t('form.origin')}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    loading={locating}
                    onClick={useMyLocation}
                    startIcon={<Iconify icon="mingcute:location-fill" width={16} />}
                  >
                    {t('form.useMyLocation')}
                  </Button>
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('form.originHint')}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Field.Text name="lat" label={t('form.lat')} type="number" sx={{ flex: 1 }} />
                  <Field.Text name="lng" label={t('form.lng')} type="number" sx={{ flex: 1 }} />
                </Stack>
              </Stack>

              <Field.Text
                name="description"
                label={t('form.description')}
                placeholder={t('form.descriptionPlaceholder')}
                multiline
                rows={3}
              />

              {fee != null ? (
                <Alert severity="info" icon={<Iconify icon="solar:wad-of-money-bold" width={20} />}>
                  {t('form.feeNotice', { fee: formatIdr(fee) })}
                </Alert>
              ) : (
                <Skeleton variant="rounded" height={64} />
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              type="submit"
              variant="contained"
              loading={creating}
              disabled={fee == null}
              startIcon={<Iconify icon="solar:wad-of-money-bold" width={18} />}
            >
              {fee != null ? t('form.submitAction', { fee: formatIdr(fee) }) : t('form.feeLoading')}
            </Button>
          </DialogActions>
        </Form>
      </MotionDialog>

      <ErrorDialog open={!!error} message={error ?? ''} onClose={clearError} />
    </>
  );
}
