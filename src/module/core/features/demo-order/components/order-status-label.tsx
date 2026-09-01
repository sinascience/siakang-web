import type { OrderStatus } from '../types';
import type { LabelColor } from 'src/shared/ui/label';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';

// ----------------------------------------------------------------------

const STATUS_COLOR: Record<OrderStatus, LabelColor> = {
  pending: 'warning',
  processing: 'info',
  shipped: 'primary',
  completed: 'success',
  cancelled: 'error',
};

type Props = {
  status: OrderStatus;
  variant?: 'soft' | 'filled';
};

/** Shared between the table row and the detail page so the colors never drift. */
export function OrderStatusLabel({ status, variant = 'soft' }: Props) {
  const { t } = useTranslate('demo-order');

  return (
    <Label color={STATUS_COLOR[status]} variant={variant}>
      {t(`statuses.${status}`)}
    </Label>
  );
}
