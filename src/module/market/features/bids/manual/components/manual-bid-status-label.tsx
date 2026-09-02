import type { BidStatus } from '../../types';
import type { LabelColor } from 'src/shared/ui/label';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';

// ----------------------------------------------------------------------
// Covers the full BidStatus union (shared with auto-mode) even though a
// manual bid only ever visits `open` -> `ordered` (or `cancelled`) per the
// task contract — defensive, and keeps this component reusable if FE-E
// wants it too.
// ----------------------------------------------------------------------

const STATUS_COLOR: Record<BidStatus, LabelColor> = {
  matching: 'default',
  proposed: 'info',
  customer_confirmed: 'info',
  accepted: 'success',
  no_match: 'error',
  open: 'info',
  awarded: 'primary',
  ordered: 'success',
  cancelled: 'error',
};

type Props = {
  status: BidStatus;
  variant?: 'soft' | 'filled';
};

export function ManualBidStatusLabel({ status, variant = 'soft' }: Props) {
  const { t } = useTranslate('bids-manual');

  return (
    <Label color={STATUS_COLOR[status]} variant={variant}>
      {t(`statuses.${status}`)}
    </Label>
  );
}
