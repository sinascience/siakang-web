import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { FinanceDashboardView } from '../views/finance-dashboard-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('dashboard');

  return (
    <>
      <title>{`${t('finance.title')} - ${CONFIG.appName}`}</title>

      <FinanceDashboardView />
    </>
  );
}
