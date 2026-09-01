import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { DemoOrderListView } from '../views/demo-order-list-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('demo-order');

  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <DemoOrderListView />
    </>
  );
}
