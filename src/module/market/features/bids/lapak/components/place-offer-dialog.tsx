import type { TFunction } from 'i18next';
import type { Bid } from 'src/module/market/features/bids/types';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { MotionDialog } from 'src/shared/ui/animate';
import { ErrorDialog } from 'src/shared/ui/error-dialog';
import { Form, Field, RHFNumericField } from 'src/shared/ui/hook-form';
import { formatIdr } from 'src/module/market/features/orders/utils/format';

import { useMyBidOffer } from '../hooks/use-my-bid-offer';
import { usePlaceBidOffer } from '../hooks/use-place-bid-offer';

// ----------------------------------------------------------------------

function makeSchema(t: TFunction) {
  return z.object({
    amount_idr: z
      .number({ message: t('offerDialog.validation.amountRequired') })
      .min(1, { message: t('offerDialog.validation.amountMin') }),
    message: z
      .string()
      .max(500, { message: t('offerDialog.validation.messageMax') })
      .optional()
      .or(z.literal('')),
  });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  bid: Bid | null;
  onClose: () => void;
  /** Parent refreshes the manual-bids list after a successful place/update. */
  onPlaced: () => void;
};

export function PlaceOfferDialog({ open, bid, onClose, onPlaced }: Props) {
  const { t } = useTranslate('bids-lapak');
  const schema = useMemo(() => makeSchema(t), [t]);

  const { data: existingOffer, loading: loadingOffer } = useMyBidOffer(
    open ? (bid?.id ?? null) : null
  );
  const { place, loading: placing, error, clearError } = usePlaceBidOffer();

  const defaultValues = useMemo<FormValues>(
    () => ({
      amount_idr: existingOffer?.amount_idr ?? bid?.budget_idr ?? 0,
      message: existingOffer?.message ?? '',
    }),
    [existingOffer, bid]
  );

  const methods = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  useEffect(() => {
    if (open) methods.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultValues]);

  const isUpdate = !!existingOffer;

  const onSubmit = methods.handleSubmit(async (values) => {
    if (!bid) return;
    const saved = await place(bid.id, {
      amount_idr: values.amount_idr,
      message: values.message || undefined,
    });
    if (saved) {
      toast.success(isUpdate ? t('offerDialog.updateSuccess') : t('offerDialog.placeSuccess'));
      onPlaced();
    }
  });

  return (
    <>
      <MotionDialog open={open && !!bid} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, pr: 2.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {isUpdate ? t('offerDialog.updateTitle') : t('offerDialog.newTitle')}
            </Typography>
            <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
              {bid?.title}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} disabled={placing}>
            <Iconify icon="mingcute:close-line" width={18} />
          </IconButton>
        </DialogTitle>

        <Form methods={methods} onSubmit={onSubmit} sx={{ display: 'contents' }}>
          <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
            {loadingOffer ? (
              <Skeleton variant="rounded" height={140} />
            ) : (
              <Stack spacing={2.5}>
                {bid && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {t('offerDialog.subtitleBudget', { amount: formatIdr(bid.budget_idr) })}
                  </Typography>
                )}

                {isUpdate && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'warning.main',
                      bgcolor: 'warning.lighter',
                      borderRadius: 1,
                      p: 1,
                    }}
                  >
                    {t('offerDialog.alreadyOfferedHint')}
                  </Typography>
                )}

                <RHFNumericField
                  name="amount_idr"
                  label={t('offerDialog.amountLabel')}
                  prefix="Rp"
                />

                <Field.Text
                  name="message"
                  label={t('offerDialog.messageLabel')}
                  multiline
                  rows={3}
                />

                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('offerDialog.notMoneyHint')}
                </Typography>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              type="submit"
              variant="contained"
              loading={placing}
              disabled={loadingOffer}
              startIcon={<Iconify icon="solar:check-circle-bold" width={18} />}
            >
              {isUpdate ? t('offerDialog.updateAction') : t('offerDialog.placeAction')}
            </Button>
          </DialogActions>
        </Form>
      </MotionDialog>

      <ErrorDialog open={!!error} message={error ?? ''} onClose={clearError} />
    </>
  );
}
