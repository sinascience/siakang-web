import type { IconifyName } from 'src/shared/ui/iconify';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { Iconify } from 'src/shared/ui/iconify';

import { useAuthContext } from '../../auth/hooks';

// ----------------------------------------------------------------------

type ColorKey = 'primary' | 'info' | 'success' | 'warning';

const stats: { key: string; value: string; icon: IconifyName; color: ColorKey }[] = [
  { key: 'revenue', value: 'Rp 4,8 M', icon: 'solar:wad-of-money-bold', color: 'primary' },
  { key: 'orders', value: '3.842', icon: 'solar:cart-plus-bold', color: 'info' },
  { key: 'uptime', value: '99,95%', icon: 'solar:shield-check-bold', color: 'success' },
  { key: 'users', value: '1.284', icon: 'solar:users-group-rounded-bold', color: 'warning' },
];

const shortcuts: { key: string; href: string; icon: IconifyName; color: ColorKey }[] = [
  {
    key: 'finance',
    href: paths.dashboard.dashboards.finance,
    icon: 'solar:bill-list-bold-duotone',
    color: 'primary',
  },
  {
    key: 'monitoring',
    href: paths.dashboard.dashboards.monitoring,
    icon: 'solar:monitor-bold',
    color: 'info',
  },
  {
    key: 'sales',
    href: paths.dashboard.dashboards.sales,
    icon: 'solar:cart-3-bold',
    color: 'success',
  },
];

// Dummy activity feed.
const activity: { icon: IconifyName; color: ColorKey; text: string; time: string }[] = [
  {
    icon: 'solar:bill-list-bold',
    color: 'primary',
    text: 'Invoice INV-2031 paid by PT Cahaya Abadi',
    time: '2 min ago',
  },
  {
    icon: 'solar:user-plus-bold',
    color: 'info',
    text: 'New user registered — rina@acme.id',
    time: '1 hour ago',
  },
  {
    icon: 'solar:check-circle-bold',
    color: 'success',
    text: 'Deployment v1.4.2 finished successfully',
    time: '3 hours ago',
  },
  {
    icon: 'solar:danger-triangle-bold',
    color: 'warning',
    text: 'Payments service latency degraded',
    time: '5 hours ago',
  },
];

export function HomeView() {
  const { t } = useTranslate('home');
  const theme = useTheme();
  const { user } = useAuthContext();

  const name = user?.full_name || user?.username || '';
  const tint = (color: ColorKey) => varAlpha(theme.vars.palette[color].mainChannel, 0.12);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h4">
          {name ? t('greeting', { name }) : t('greetingGuest')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('intro')}
        </Typography>
      </Stack>

      {/* Quick stats */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        }}
      >
        {stats.map((s) => (
          <Card key={s.key} sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                flexShrink: 0,
                display: 'flex',
                borderRadius: '50%',
                alignItems: 'center',
                justifyContent: 'center',
                color: `${s.color}.main`,
                bgcolor: tint(s.color),
              }}
            >
              <Iconify icon={s.icon} width={26} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5">{s.value}</Typography>
              <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                {t(`stats.${s.key}`)}
              </Typography>
            </Box>
          </Card>
        ))}
      </Box>

      {/* Shortcuts + activity */}
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
        }}
      >
        <Box sx={{ gridColumn: { md: 'span 7' } }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('shortcuts.title')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            }}
          >
            {shortcuts.map((s) => (
              <Card key={s.key}>
                <CardActionArea
                  component={RouterLink}
                  href={s.href}
                  sx={{ p: 3, height: '100%' }}
                >
                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        display: 'flex',
                        borderRadius: 1.5,
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: `${s.color}.main`,
                        bgcolor: tint(s.color),
                      }}
                    >
                      <Iconify icon={s.icon} width={28} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1">{t(`shortcuts.${s.key}`)}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {t(`shortcuts.${s.key}Desc`)}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: `${s.color}.main` }}>
                      <Typography variant="button">{t('shortcuts.open')}</Typography>
                      <Iconify icon="eva:arrow-ios-forward-fill" width={16} />
                    </Stack>
                  </Stack>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Box>

        <Card sx={{ gridColumn: { md: 'span 5' } }}>
          <CardHeader title={t('activity.title')} />
          <Stack divider={<Divider flexItem />} sx={{ px: 3, py: 1 }}>
            {activity.map((a) => (
              <Stack key={a.text} direction="row" spacing={2} sx={{ py: 1.5, alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    display: 'flex',
                    borderRadius: '50%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: `${a.color}.main`,
                    bgcolor: tint(a.color),
                  }}
                >
                  <Iconify icon={a.icon} width={20} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {a.text}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {a.time}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
          <Box sx={{ p: 2, pt: 1 }}>
            <Label variant="soft" color="success">
              {t('activity.live')}
            </Label>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
