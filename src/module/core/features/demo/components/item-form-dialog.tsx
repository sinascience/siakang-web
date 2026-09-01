import type { TFunction } from 'i18next';
import type { ItemDataset } from '../api';
import type { Item, ItemCategory, CreateItemPayload, UpdateItemPayload } from '../types';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { MotionDialog } from 'src/shared/ui/animate';
import { ErrorDialog } from 'src/shared/ui/error-dialog';
import { Form, Field, RHFNumericField } from 'src/shared/ui/hook-form';

import { ITEM_CATEGORIES } from '../types';
import { createItem, updateItem } from '../api';

// ----------------------------------------------------------------------

function makeSchema(t: TFunction) {
  return z.object({
    code: z.string().max(50).optional().or(z.literal('')),
    name: z
      .string()
      .min(2, { message: t('validation.nameMin') })
      .max(255, { message: t('validation.nameMax') }),
    category: z.enum(ITEM_CATEGORIES as [ItemCategory, ...ItemCategory[]]),
    price: z.number({ message: t('validation.priceRequired') }).min(1, {
      message: t('validation.priceMin'),
    }),
    stock: z.number({ message: t('validation.stockRequired') }).min(0, {
      message: t('validation.stockMin'),
    }),
    description: z.string().max(500, { message: t('validation.descMax') }).optional().or(z.literal('')),
    is_active: z.boolean(),
  });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  mode: 'new' | 'edit';
  dataset: ItemDataset;
  seed?: Item | null;
  onClose: () => void;
  onSaved: (item: Item) => void;
};

export function ItemFormDialog({ open, mode, dataset, seed, onClose, onSaved }: Props) {
  const { t } = useTranslate('demo');
  const { t: tCommon } = useTranslate('common');
  const schema = useMemo(() => makeSchema(t), [t]);

  const submitting = useBoolean();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const initialValue = seed ?? null;

  const defaultValues = useMemo<FormValues>(
    () => ({
      code: initialValue?.code ?? '',
      name: initialValue?.name ?? '',
      category: initialValue?.category ?? 'electronics',
      price: initialValue?.price ?? 0,
      stock: initialValue?.stock ?? 0,
      description: initialValue?.description ?? '',
      is_active: initialValue?.is_active ?? true,
    }),
    [initialValue]
  );

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const { handleSubmit, watch, setValue } = methods;
  const isEditing = mode === 'edit';

  useEffect(() => {
    if (open) methods.reset(defaultValues);
    if (!open) setErrorMsg(null);
  }, [open, defaultValues, methods]);

  const onSave = handleSubmit(async (values) => {
    setErrorMsg(null);
    submitting.onTrue();
    try {
      let saved: Item;
      if (isEditing && initialValue) {
        const payload: UpdateItemPayload = {
          name: values.name,
          category: values.category,
          price: values.price,
          stock: values.stock,
          description: values.description || null,
          is_active: values.is_active,
        };
        saved = await updateItem(dataset, initialValue.id, payload);
      } else {
        const payload: CreateItemPayload = {
          code: values.code || undefined,
          name: values.name,
          category: values.category,
          price: values.price,
          stock: values.stock,
          description: values.description || null,
          is_active: values.is_active,
        };
        saved = await createItem(dataset, payload);
      }
      onSaved(saved);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('errors.saveFailed'));
    } finally {
      submitting.onFalse();
    }
  });

  const title = isEditing
    ? t('form.editTitle', { name: initialValue?.name ?? '' })
    : t('form.newTitle');

  return (
    <>
      <MotionDialog
        open={open}
        onClose={submitting.value ? undefined : onClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, pr: 2.5 }}>
          <Box sx={{ flex: 1 }}>{title}</Box>
          <IconButton size="small" onClick={onClose} disabled={submitting.value}>
            <Iconify icon="mingcute:close-line" width={18} />
          </IconButton>
        </DialogTitle>
        <Form methods={methods} onSubmit={onSave} sx={{ display: 'contents' }}>
          <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2.5}>
              <Field.Text name="name" label={t('form.name')} />

              <Field.Text
                name="code"
                label={t('form.code')}
                disabled={isEditing}
                helperText={isEditing ? t('form.codeImmutable') : t('form.codeHint')}
              />

              <Field.Select name="category" label={t('form.category')}>
                {ITEM_CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {t(`categories.${cat}`)}
                  </MenuItem>
                ))}
              </Field.Select>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
                <RHFNumericField name="price" label={t('form.price')} prefix="Rp" />
                <RHFNumericField name="stock" label={t('form.stock')} />
              </Stack>

              <Field.Text
                name="description"
                label={t('form.description')}
                multiline
                rows={3}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={watch('is_active')}
                    onChange={(e) => setValue('is_active', e.target.checked)}
                  />
                }
                label={t('form.isActive')}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Iconify icon="solar:check-circle-bold" />}
              loading={submitting.value}
            >
              {tCommon('actions.save')}
            </Button>
          </DialogActions>
        </Form>
      </MotionDialog>

      <ErrorDialog open={!!errorMsg} message={errorMsg ?? ''} onClose={() => setErrorMsg(null)} />
    </>
  );
}
