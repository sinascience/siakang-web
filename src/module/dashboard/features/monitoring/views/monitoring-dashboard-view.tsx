import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { Iconify } from 'src/shared/ui/iconify';
import { PageHeader } from 'src/shared/ui/page-header';

import { KpiCard, ChartCard } from '../../../components';
import { fNumber, fCompact, fPercent } from '../../../utils/format';
import {
  HOURS,
  services,
  latencyP50,
  latencyP95,
  requestVolume,
  monitoringKpis,
  resourceGauges,
  httpStatusCodes,
  serviceStatusColor,
} from '../data/mock';

// ----------------------------------------------------------------------

const CHART_H = 320;

export function MonitoringDashboardView() {
  const { t } = useTranslate('dashboard');
  const theme = useTheme();

  const vs = t('monitoring.vsYesterday');

  const gaugeColor = (v: number) =>
    v >= 80 ? theme.palette.error.main : v >= 60 ? theme.palette.warning.main : theme.palette.success.main;

  const httpColors = [
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.error.main,
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader title={t('monitoring.title')} subtitle={t('monitoring.subtitle')} />

      {/* KPI row */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        }}
      >
        <KpiCard
          title={t('monitoring.kpi.uptime')}
          value={fPercent(monitoringKpis.uptime.value, 2)}
          delta={monitoringKpis.uptime.delta}
          deltaLabel={vs}
          spark={monitoringKpis.uptime.spark}
          icon="solar:shield-check-bold"
          color="success"
        />
        <KpiCard
          title={t('monitoring.kpi.response')}
          value={`${fNumber(monitoringKpis.response.value)} ms`}
          delta={monitoringKpis.response.delta}
          deltaLabel={vs}
          spark={monitoringKpis.response.spark}
          icon="solar:clock-circle-bold"
          color="info"
          invertDelta
        />
        <KpiCard
          title={t('monitoring.kpi.requests')}
          value={`${fCompact(monitoringKpis.requests.value)}/min`}
          delta={monitoringKpis.requests.delta}
          deltaLabel={vs}
          spark={monitoringKpis.requests.spark}
          icon="solar:monitor-bold"
          color="primary"
        />
        <KpiCard
          title={t('monitoring.kpi.errors')}
          value={fPercent(monitoringKpis.errors.value, 2)}
          delta={monitoringKpis.errors.delta}
          deltaLabel={vs}
          spark={monitoringKpis.errors.spark}
          icon="solar:danger-triangle-bold"
          color="error"
          invertDelta
        />
      </Box>

      {/* Row 2: request volume + resource gauges */}
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
        }}
      >
        <ChartCard
          title={t('monitoring.charts.requestVolume')}
          subheader={t('monitoring.charts.requestVolumeSub')}
          sx={{ gridColumn: { md: 'span 8' } }}
        >
          <LineChart
            height={CHART_H}
            xAxis={[{ data: HOURS, scaleType: 'point' }]}
            series={[
              {
                data: requestVolume,
                label: t('monitoring.series.requests'),
                color: theme.palette.primary.main,
                area: true,
                showMark: false,
                curve: 'natural',
              },
            ]}
            margin={{ left: 16, right: 24, top: 24, bottom: 24 }}
            sx={{ '& .MuiAreaElement-root': { fillOpacity: 0.12 } }}
          />
        </ChartCard>

        <Card sx={{ gridColumn: { md: 'span 4' } }}>
          <CardHeader title={t('monitoring.charts.resources')} />
          <Box
            sx={{
              p: 3,
              display: 'grid',
              gap: 1,
              gridTemplateColumns: 'repeat(3, 1fr)',
            }}
          >
            {resourceGauges.map((g) => (
              <Stack key={g.label} spacing={1} sx={{ alignItems: 'center' }}>
                <Box sx={{ width: '100%', height: 120 }}>
                  <Gauge
                    value={g.value}
                    startAngle={-110}
                    endAngle={110}
                    text={({ value }) => `${value}%`}
                    sx={{
                      [`& .${gaugeClasses.valueText}`]: { fontSize: 16, fontWeight: 700 },
                      [`& .${gaugeClasses.valueArc}`]: { fill: gaugeColor(g.value) },
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {g.label}
                </Typography>
              </Stack>
            ))}
          </Box>
        </Card>
      </Box>

      {/* Row 3: latency + service health */}
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
        }}
      >
        <ChartCard
          title={t('monitoring.charts.latency')}
          subheader={t('monitoring.charts.latencySub')}
          sx={{ gridColumn: { md: 'span 7' } }}
        >
          <LineChart
            height={CHART_H}
            xAxis={[{ data: HOURS, scaleType: 'point' }]}
            series={[
              {
                data: latencyP50,
                label: t('monitoring.series.p50'),
                color: theme.palette.info.main,
                showMark: false,
                curve: 'natural',
              },
              {
                data: latencyP95,
                label: t('monitoring.series.p95'),
                color: theme.palette.warning.main,
                showMark: false,
                curve: 'natural',
              },
            ]}
            margin={{ left: 16, right: 24, top: 24, bottom: 24 }}
          />
        </ChartCard>

        <Card sx={{ gridColumn: { md: 'span 5' } }}>
          <CardHeader title={t('monitoring.charts.serviceHealth')} />
          <Stack divider={<Divider flexItem />} sx={{ px: 3, py: 1 }}>
            {services.map((s) => (
              <Stack
                key={s.name}
                direction="row"
                spacing={2}
                sx={{ py: 1.5, alignItems: 'center' }}
              >
                <Iconify
                  icon="solar:ssd-round-bold"
                  width={28}
                  sx={{ color: 'text.disabled', flexShrink: 0 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {s.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {s.latency > 0 ? `${s.latency} ms` : '—'} · {fPercent(s.uptime, 2)}
                  </Typography>
                </Box>
                <Label variant="soft" color={serviceStatusColor[s.status]}>
                  {t(`monitoring.status.${s.status}`)}
                </Label>
              </Stack>
            ))}
          </Stack>
        </Card>
      </Box>

      {/* Row 4: HTTP status codes */}
      <ChartCard title={t('monitoring.charts.httpStatus')} sx={{ mt: 3 }}>
        <BarChart
          height={260}
          layout="horizontal"
          yAxis={[{ data: httpStatusCodes.map((h) => h.code), scaleType: 'band' }]}
          xAxis={[{ valueFormatter: (v: number) => fCompact(v) }]}
          series={[
            {
              data: httpStatusCodes.map((h) => h.count),
              label: t('monitoring.series.responses'),
              valueFormatter: (v) => (v == null ? '' : fNumber(v)),
            },
          ]}
          colors={httpColors}
          borderRadius={4}
          margin={{ left: 16, right: 24, top: 16, bottom: 24 }}
          slotProps={{ legend: { sx: { display: 'none' } } }}
        />
      </ChartCard>
    </Box>
  );
}
