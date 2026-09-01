import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { WalletView } from '../views/wallet-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('wallet');

  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <WalletView />
    </>
  );
}
