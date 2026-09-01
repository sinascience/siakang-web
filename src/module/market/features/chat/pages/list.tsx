import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { ChatListView } from '../views/chat-list-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('chat');

  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <ChatListView />
    </>
  );
}
