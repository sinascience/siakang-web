import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { AutoBidListView } from '../views/auto-bid-list-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('bids-auto');

  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <AutoBidListView />
    </>
  );
}
