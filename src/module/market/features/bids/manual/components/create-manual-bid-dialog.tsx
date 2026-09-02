import type { TFunction } from 'i18next';
import type { Bid } from '../../types';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
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

import { useBidCategories } from '../hooks/use-bid-categories';
import { useCreateManualBid } from '../hooks/use-create-manual-bid';

// ----------------------------------------------------------------------

function makeSchema(t: TFunction) {
  return z.object({
    category_id: z.string().min(1, { message: t('form.validation.categoryRequired') }),
    title: z
      .string()
      .min(1, { message: t('form.validation.titleRequired') })
      .max(160, { message: t('form.validation.titleMax') }),
    description: z
      .string()
      .max(2000, { message: t('form.validation.descriptionMax') })
      .optional()
      .or(z.literal('')),
    budget_idr: z
      .number({ message: t('form.validation.budgetRequired') })
      .min(1, { message: t('form.validation.budgetMin') }),
  });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

const DEFAULT_VALUES: FormValues = {
  category_id: '',
  title: '',
  description: '',
  budget_idr: 0,
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (bid: Bid) => void;
};

/**
 * Create-only — a manual bid is never edited from here (no `mode` prop, no
 * `seed`). No fullscreen-expand toggle either: unlike the multi-line/
 * multi-tab forms that convention calls for it on (cash-transactions,
 * journal-entry), this is four fields — same call as `demo/item-form-dialog.tsx`,
 * the closest small-form precedent in this repo.
 */
export function CreateManualBidDialog({ open, onClose, onCreated }: Props) {
  const { t } = useTranslate('bids-manual');
  const { data: categories } = useBidCategories();
  const { create, loading, error, clearError } = useCreateManualBid();
  const schema = useMemo(() => makeSchema(t), [t]);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) methods.reset(DEFAULT_VALUES);
    if (!open) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = methods.handleSubmit(async (values) => {
    const bid = await create({
      category_id: values.category_id,
      title: values.title,
      description: values.description || undefined,
      budget_idr: values.budget_idr,
    });
    if (bid) onCreated(bid);
  });

  return (
    <>
      <MotionDialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, pr: 2.5 }}>
          <Box sx={{ flex: 1 }}>{t('form.newTitle')}</Box>
          <IconButton size="small" onClick={onClose} disabled={loading}>
            <Iconify icon="mingcute:close-line" width={18} />
          </IconButton>
        </DialogTitle>

        <Form methods={methods} onSubmit={onSubmit} sx={{ display: 'contents' }}>
          <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2.5}>
              <Field.Select name="category_id" label={t('form.category')}>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Text
                name="title"
                label={t('form.title')}
                placeholder={t('form.titlePlaceholder')}
              />

              <Field.Text
                name="description"
                label={t('form.description')}
                placeholder={t('form.descriptionPlaceholder')}
                multiline
                rows={3}
              />

              <RHFNumericField
                name="budget_idr"
                label={t('form.budget')}
                prefix="Rp"
                helperText={t('form.budgetHint')}
              />

              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('form.freeHint')}
              </Typography>
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              loading={loading}
            >
              {t('form.postAction')}
            </Button>
          </DialogActions>
        </Form>
      </MotionDialog>

      <ErrorDialog open={!!error} message={error ?? ''} onClose={clearError} />
    </>
  );
}
