import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import LinearProgress from '@mui/material/LinearProgress';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { PageHeader } from 'src/shared/ui/page-header';

import { KpiCard, ChartCard } from '../../../components';
import { fNumber, fCurrency } from '../../../utils/format';
import {
  MONTHS,
  financeKpis,
  budgetUsage,
  cashInSeries,
  txStatusColor,
  cashOutSeries,
  revenueSeries,
  expenseSeries,
  expenseByCategory,
  recentTransactions,
} from '../data/mock';

// ----------------------------------------------------------------------

const CHART_H = 340;

export function FinanceDashboardView() {
  const { t } = useTranslate('dashboard');
  const theme = useTheme();

  const vs = t('finance.vsLastMonth');

  const pieColors = [
    theme.palette.primary.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.success.main,
    theme.palette.error.main,
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader title={t('finance.title')} subtitle={t('finance.subtitle')} />

      {/* KPI row */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        }}
      >
        <KpiCard
          title={t('finance.kpi.revenue')}
          value={fCurrency(financeKpis.revenue.value)}
          delta={financeKpis.revenue.delta}
          deltaLabel={vs}
          spark={financeKpis.revenue.spark}
          icon="solar:wad-of-money-bold"
          color="primary"
        />
        <KpiCard
          title={t('finance.kpi.expense')}
          value={fCurrency(financeKpis.expense.value)}
          delta={financeKpis.expense.delta}
          deltaLabel={vs}
          spark={financeKpis.expense.spark}
          icon="solar:bill-list-bold"
          color="warning"
        />
        <KpiCard
          title={t('finance.kpi.profit')}
          value={fCurrency(financeKpis.profit.value)}
          delta={financeKpis.profit.delta}
          deltaLabel={vs}
          spark={financeKpis.profit.spark}
          icon="solar:chart-square-outline"
          color="success"
        />
        <KpiCard
          title={t('finance.kpi.cash')}
          value={fCurrency(financeKpis.cash.value)}
          delta={financeKpis.cash.delta}
          deltaLabel={vs}
          spark={financeKpis.cash.spark}
          icon="solar:case-minimalistic-bold"
          color="info"
        />
      </Box>

      {/* Row 2: revenue vs expense + expense breakdown */}
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
        }}
      >
        <ChartCard
          title={t('finance.charts.revenueVsExpense')}
          subheader={t('finance.charts.inMillions')}
          sx={{ gridColumn: { md: 'span 8' } }}
        >
          <LineChart
            height={CHART_H}
            xAxis={[{ data: MONTHS, scaleType: 'point' }]}
            series={[
              {
                data: revenueSeries,
                label: t('finance.series.revenue'),
                color: theme.palette.primary.main,
                area: true,
                showMark: false,
                curve: 'natural',
              },
              {
                data: expenseSeries,
                label: t('finance.series.expense'),
                color: theme.palette.warning.main,
                showMark: false,
                curve: 'natural',
              },
            ]}
            margin={{ left: 16, right: 24, top: 24, bottom: 24 }}
            sx={{ '& .MuiAreaElement-root': { fillOpacity: 0.12 } }}
          />
        </ChartCard>

        <ChartCard
          title={t('finance.charts.expenseByCategory')}
          sx={{ gridColumn: { md: 'span 4' } }}
        >
          <PieChart
            height={CHART_H}
            series={[
              {
                innerRadius: 64,
                paddingAngle: 2,
                cornerRadius: 4,
                highlightScope: { fade: 'global', highlight: 'item' },
                data: expenseByCategory.map((c, i) => ({
                  id: i,
                  value: c.value,
                  label: c.label,
                  color: pieColors[i % pieColors.length],
                })),
                valueFormatter: (item) => fCurrency(item.value),
              },
            ]}
            margin={{ top: 16, bottom: 16, left: 16, right: 16 }}
          />
        </ChartCard>
      </Box>

      {/* Row 3: cash flow + budget usage */}
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
        }}
      >
        <ChartCard
          title={t('finance.charts.cashFlow')}
          subheader={t('finance.charts.inMillions')}
          sx={{ gridColumn: { md: 'span 8' } }}
        >
          <BarChart
            height={CHART_H}
            xAxis={[{ data: MONTHS, scaleType: 'band' }]}
            series={[
              {
                data: cashInSeries,
                label: t('finance.series.cashIn'),
                color: theme.palette.success.main,
              },
              {
                data: cashOutSeries,
                label: t('finance.series.cashOut'),
                color: theme.palette.error.main,
              },
            ]}
            borderRadius={4}
            margin={{ left: 16, right: 16, top: 24, bottom: 24 }}
          />
        </ChartCard>

        <Card sx={{ gridColumn: { md: 'span 4' } }}>
          <CardHeader title={t('finance.charts.budgetUsage')} />
          <Stack spacing={2.5} sx={{ p: 3 }}>
            {budgetUsage.map((b) => {
              const pct = Math.round((b.used / b.total) * 100);
              return (
                <Box key={b.label}>
                  <Stack
                    direction="row"
                    sx={{ mb: 1, alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Typography variant="subtitle2">{b.label}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {fCurrency(b.used)} / {fCurrency(b.total)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    color={pct >= 90 ? 'error' : pct >= 75 ? 'warning' : 'primary'}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              );
            })}
          </Stack>
        </Card>
      </Box>

      {/* Row 4: recent transactions */}
      <Card sx={{ mt: 3 }}>
        <CardHeader title={t('finance.charts.recentTx')} />
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell>{t('finance.table.invoice')}</TableCell>
                <TableCell>{t('finance.table.client')}</TableCell>
                <TableCell>{t('finance.table.date')}</TableCell>
                <TableCell align="right">{t('finance.table.amount')}</TableCell>
                <TableCell align="center">{t('finance.table.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentTransactions.map((tx) => (
                <TableRow key={tx.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{tx.id}</TableCell>
                  <TableCell>{tx.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{tx.date}</TableCell>
                  <TableCell align="right">Rp {fNumber(tx.amount)}</TableCell>
                  <TableCell align="center">
                    <Label variant="soft" color={txStatusColor[tx.status]}>
                      {t(`finance.status.${tx.status}`)}
                    </Label>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
}
