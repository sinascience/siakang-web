import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { GigListView } from '../views/gig-list-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('gigs');

  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <GigListView />
    </>
  );
}
