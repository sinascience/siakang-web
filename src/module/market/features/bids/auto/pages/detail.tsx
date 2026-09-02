import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { AutoBidDetailView } from '../views/auto-bid-detail-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('bids-auto');

  return (
    <>
      <title>{`${t('detail.title')} - ${CONFIG.appName}`}</title>
      <AutoBidDetailView />
    </>
  );
}
