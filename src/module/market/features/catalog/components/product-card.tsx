import type { Product } from '../types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/shared/ui/iconify';
import { formatIdr } from 'src/module/market/features/orders/utils/format';

// ----------------------------------------------------------------------

type Props = {
  product: Product;
};

export function ProductCard({ product }: Props) {
  return (
    <Card>
      <CardActionArea component={RouterLink} href={paths.dashboard.market.product(product.id)}>
        <Box sx={{ position: 'relative', pt: '100%', bgcolor: 'background.neutral' }}>
          {product.image_url ? (
            <Box
              component="img"
              src={product.image_url}
              alt={product.title}
              sx={{ position: 'absolute', inset: 0, width: 1, height: 1, objectFit: 'cover' }}
            />
          ) : (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.disabled',
              }}
            >
              <Iconify icon="solar:box-minimalistic-bold" width={48} />
            </Box>
          )}
        </Box>

        <Stack spacing={0.75} sx={{ p: 2 }}>
          <Typography variant="subtitle1" noWrap>
            {product.title}
          </Typography>

          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Typography variant="caption" noWrap sx={{ flex: 1, color: 'text.secondary' }}>
              {product.lapak.name}
            </Typography>
            <Iconify icon="eva:star-fill" width={14} sx={{ color: 'warning.main', flexShrink: 0 }} />
            <Typography variant="caption" sx={{ flexShrink: 0 }}>
              {product.lapak.rating.toFixed(1)}
            </Typography>
          </Stack>

          <Typography variant="subtitle1" sx={{ color: 'primary.main' }}>
            {formatIdr(product.price_idr)}
          </Typography>
        </Stack>
      </CardActionArea>
    </Card>
  );
}
