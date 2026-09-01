import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import LinearProgress from '@mui/material/LinearProgress';

import { useTranslate } from 'src/locales';
import { PageHeader } from 'src/shared/ui/page-header';

import { KpiCard, ChartCard } from '../../../components';
import { fNumber, fCompact, fPercent, fCurrency } from '../../../utils/format';
import {
  MONTHS,
  salesKpis,
  topProducts,
  salesSeries,
  salesByChannel,
  trafficSources,
  conversionFunnel,
} from '../data/mock';

// ----------------------------------------------------------------------

const CHART_H = 340;

export function SalesDashboardView() {
  const { t } = useTranslate('dashboard');
  const theme = useTheme();

  const vs = t('sales.vsLastPeriod');

  const pieColors = [
    theme.palette.primary.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.success.main,
    theme.palette.error.main,
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader title={t('sales.title')} subtitle={t('sales.subtitle')} />

      {/* KPI row */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        }}
      >
        <KpiCard
          title={t('sales.kpi.sales')}
          value={fCurrency(salesKpis.sales.value)}
          delta={salesKpis.sales.delta}
          deltaLabel={vs}
          spark={salesKpis.sales.spark}
          icon="solar:cart-3-bold"
          color="primary"
        />
        <KpiCard
          title={t('sales.kpi.orders')}
          value={fNumber(salesKpis.orders.value)}
          delta={salesKpis.orders.delta}
          deltaLabel={vs}
          spark={salesKpis.orders.spark}
          icon="solar:cart-plus-bold"
          color="info"
        />
        <KpiCard
          title={t('sales.kpi.conversion')}
          value={fPercent(salesKpis.conversion.value)}
          delta={salesKpis.conversion.delta}
          deltaLabel={vs}
          spark={salesKpis.conversion.spark}
          icon="ic:round-filter-list"
          color="success"
        />
        <KpiCard
          title={t('sales.kpi.aov')}
          value={fCurrency(salesKpis.aov.value)}
          delta={salesKpis.aov.delta}
          deltaLabel={vs}
          spark={salesKpis.aov.spark}
          icon="solar:tag-horizontal-bold-duotone"
          color="warning"
        />
      </Box>

      {/* Row 2: sales trend + traffic sources */}
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
        }}
      >
        <ChartCard
          title={t('sales.charts.salesTrend')}
          subheader={t('sales.charts.inMillions')}
          sx={{ gridColumn: { md: 'span 8' } }}
        >
          <LineChart
            height={CHART_H}
            xAxis={[{ data: MONTHS, scaleType: 'point' }]}
            series={[
              {
                data: salesSeries,
                label: t('sales.series.sales'),
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

        <ChartCard title={t('sales.charts.trafficSources')} sx={{ gridColumn: { md: 'span 4' } }}>
          <PieChart
            height={CHART_H}
            series={[
              {
                innerRadius: 64,
                paddingAngle: 2,
                cornerRadius: 4,
                highlightScope: { fade: 'global', highlight: 'item' },
                data: trafficSources.map((s, i) => ({
                  id: i,
                  value: s.value,
                  label: s.label,
                  color: pieColors[i % pieColors.length],
                })),
                valueFormatter: (item) => `${item.value}%`,
              },
            ]}
            margin={{ top: 16, bottom: 16, left: 16, right: 16 }}
          />
        </ChartCard>
      </Box>

      {/* Row 3: sales by channel + top products */}
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
        }}
      >
        <ChartCard
          title={t('sales.charts.byChannel')}
          subheader={t('sales.charts.inMillions')}
          sx={{ gridColumn: { md: 'span 7' } }}
        >
          <BarChart
            height={CHART_H}
            xAxis={[{ data: salesByChannel.map((c) => c.label), scaleType: 'band' }]}
            series={[
              {
                data: salesByChannel.map((c) => c.value),
                label: t('sales.series.channel'),
                color: theme.palette.primary.main,
              },
            ]}
            borderRadius={6}
            margin={{ left: 16, right: 16, top: 24, bottom: 24 }}
            slotProps={{ legend: { sx: { display: 'none' } } }}
          />
        </ChartCard>

        <Card sx={{ gridColumn: { md: 'span 5' } }}>
          <CardHeader title={t('sales.charts.topProducts')} />
          <Stack spacing={2.5} sx={{ p: 3 }}>
            {topProducts.map((p) => (
              <Box key={p.name}>
                <Stack
                  direction="row"
                  sx={{ mb: 1, alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {p.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {fNumber(p.sold)} {t('sales.product.sold')}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" sx={{ flexShrink: 0 }}>
                    {fCurrency(p.revenue)}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={p.share}
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Box>
            ))}
          </Stack>
        </Card>
      </Box>

      {/* Row 4: conversion funnel */}
      <ChartCard
        title={t('sales.charts.funnel')}
        subheader={t('sales.charts.funnelSub')}
        sx={{ mt: 3 }}
      >
        <BarChart
          height={300}
          layout="horizontal"
          yAxis={[{ data: conversionFunnel.map((s) => s.label), scaleType: 'band' }]}
          xAxis={[{ valueFormatter: (v: number) => fCompact(v) }]}
          series={[
            {
              data: conversionFunnel.map((s) => s.value),
              label: t('sales.series.users'),
              color: theme.palette.info.main,
              valueFormatter: (v) => (v == null ? '' : fNumber(v)),
            },
          ]}
          borderRadius={4}
          margin={{ left: 16, right: 24, top: 16, bottom: 24 }}
          slotProps={{ legend: { sx: { display: 'none' } } }}
        />
      </ChartCard>
    </Box>
  );
}
