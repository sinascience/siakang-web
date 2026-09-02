import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { ManualBidListView } from '../views/manual-bid-list-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('bids-manual');

  return (
    <>
      <title>{`${t('list.title')} - ${CONFIG.appName}`}</title>
      <ManualBidListView />
    </>
  );
}
