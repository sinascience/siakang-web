import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { MonitoringDashboardView } from '../views/monitoring-dashboard-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('dashboard');

  return (
    <>
      <title>{`${t('monitoring.title')} - ${CONFIG.appName}`}</title>

      <MonitoringDashboardView />
    </>
  );
}
