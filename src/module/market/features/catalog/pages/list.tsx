import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { CatalogListView } from '../views/catalog-list-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('catalog');

  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <CatalogListView />
    </>
  );
}
