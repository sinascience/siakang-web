import type { GigTier } from '../types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { Iconify } from 'src/shared/ui/iconify';
import { formatIdr } from 'src/module/market/features/orders/utils/format';

// ----------------------------------------------------------------------
// One selectable tier row. Shared by the gig detail view (pick a tier to buy)
// and the order's add-tier dialog (pick a tier to append) so both surfaces read
// the same — a tier looks like a tier wherever the customer meets one.
// ----------------------------------------------------------------------

type Props = {
  tier: GigTier;
  selected: boolean;
  disabled?: boolean;
  onSelect: (tierId: string) => void;
};

export function GigTierOption({ tier, selected, disabled, onSelect }: Props) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: selected ? 'primary.main' : 'divider',
        ...(selected && { boxShadow: (theme) => `0 0 0 1px ${theme.vars.palette.primary.main}` }),
      }}
    >
      <CardActionArea disabled={disabled} onClick={() => onSelect(tier.id)} sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Iconify
            width={22}
            icon={selected ? 'solar:check-circle-bold' : 'eva:radio-button-off-fill'}
            sx={{ flexShrink: 0, color: selected ? 'primary.main' : 'text.disabled' }}
          />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2">{tier.name}</Typography>
            {tier.description && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {tier.description}
              </Typography>
            )}
          </Box>

          <Typography variant="subtitle1" noWrap sx={{ color: 'primary.main' }}>
            {formatIdr(tier.price_idr)}
          </Typography>
        </Stack>
      </CardActionArea>
    </Card>
  );
}
