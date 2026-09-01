import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { OrderDetailView } from '../views/order-detail-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('orders');

  return (
    <>
      <title>{`${t('detail.title')} - ${CONFIG.appName}`}</title>
      <OrderDetailView />
    </>
  );
}
