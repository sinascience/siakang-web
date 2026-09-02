import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { ManualBidDetailView } from '../views/manual-bid-detail-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('bids-manual');

  return (
    <>
      <title>{`${t('list.title')} - ${CONFIG.appName}`}</title>
      <ManualBidDetailView />
    </>
  );
}
