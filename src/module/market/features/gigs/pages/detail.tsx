import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { GigDetailView } from '../views/gig-detail-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('gigs');

  return (
    <>
      <title>{`${t('detail.title')} - ${CONFIG.appName}`}</title>
      <GigDetailView />
    </>
  );
}
