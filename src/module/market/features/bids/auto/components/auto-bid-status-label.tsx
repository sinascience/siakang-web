import type { BidStatus } from '../../types';
import type { LabelColor } from 'src/shared/ui/label';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';

// ----------------------------------------------------------------------
// `BidStatus` is shared across auto AND manual bids (bids/types is
// master-owned), so this map stays exhaustive over the whole union even
// though the automatic customer flow only ever produces a subset of it
// (`matching`, `proposed`, `customer_confirmed`, `no_match`, `ordered`,
// `cancelled` — `accepted` per the type's own doc comment, `open`/`awarded`
// never for mode=auto).
// ----------------------------------------------------------------------

const STATUS_COLOR: Record<BidStatus, LabelColor> = {
  matching: 'default',
  proposed: 'info',
  customer_confirmed: 'primary',
  accepted: 'primary',
  no_match: 'error',
  open: 'default',
  awarded: 'default',
  ordered: 'success',
  cancelled: 'error',
};

type Props = {
  status: BidStatus;
  variant?: 'soft' | 'filled';
};

/** Shared between the list row and the detail page so status colors never drift. */
export function AutoBidStatusLabel({ status, variant = 'soft' }: Props) {
  const { t } = useTranslate('bids-auto');

  return (
    <Label color={STATUS_COLOR[status]} variant={variant}>
      {t(`statuses.${status}`)}
    </Label>
  );
}
