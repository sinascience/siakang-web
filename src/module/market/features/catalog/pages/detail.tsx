import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { ProductDetailView } from '../views/product-detail-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('catalog');

  return (
    <>
      <title>{`${t('detail.title')} - ${CONFIG.appName}`}</title>
      <ProductDetailView />
    </>
  );
}
