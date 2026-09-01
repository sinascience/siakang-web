import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { SalesDashboardView } from '../views/sales-dashboard-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('dashboard');

  return (
    <>
      <title>{`${t('sales.title')} - ${CONFIG.appName}`}</title>

      <SalesDashboardView />
    </>
  );
}
