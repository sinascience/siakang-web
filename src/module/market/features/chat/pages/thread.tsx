import { useParams } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { ChatThreadView } from '../views/chat-thread-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('chat');
  const { id } = useParams();

  return (
    <>
      <title>{`${t('thread.title')} - ${CONFIG.appName}`}</title>
      <ChatThreadView threadId={id ?? ''} />
    </>
  );
}
