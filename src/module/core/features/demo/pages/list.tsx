import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { DemoItemListView } from '../views/demo-item-list-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('demo');

  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <DemoItemListView />
    </>
  );
}
