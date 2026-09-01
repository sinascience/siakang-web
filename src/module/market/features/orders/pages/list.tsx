import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { OrdersListView } from '../views/orders-list-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('orders');

  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <OrdersListView />
    </>
  );
}
