import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { DemoOrderDetailView } from '../views/demo-order-detail-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('demo-order');

  return (
    <>
      <title>{`${t('detail.title')} - ${CONFIG.appName}`}</title>
      <DemoOrderDetailView />
    </>
  );
}
