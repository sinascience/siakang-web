import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { LapakBidsView } from '../views/lapak-bids-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('bids-lapak');

  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <LapakBidsView />
    </>
  );
}
