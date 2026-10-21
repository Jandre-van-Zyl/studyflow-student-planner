import {
  APP_ORIGIN,
  CTU_CHANNEL,
  validAppSender,
  validRequestId,
} from '../../src/features/ctu/portalContract';
import { chromeApi as chrome } from './chromeApi';

// Isolated content script: no credentials, storage, external messages or Firebase SDK.
window.addEventListener('message', (event: MessageEvent<unknown>) => {
  if (
    event.source !== window ||
    event.origin !== APP_ORIGIN ||
    !validAppSender(location.href) ||
    !event.data ||
    typeof event.data !== 'object'
  )
    return;
  const message = event.data as Record<string, unknown>;
  if (message.channel !== CTU_CHANNEL || !validRequestId(message.requestId)) return;
  const { requestId } = message;
  if (message.type === 'probe') {
    window.postMessage({ channel: CTU_CHANNEL, type: 'ready', requestId, version: 1 }, APP_ORIGIN);
    return;
  }
  if (message.type !== 'collect' && message.type !== 'cancel') return;
  void chrome.runtime
    .sendMessage({ channel: CTU_CHANNEL, type: message.type, requestId })
    .then((response) => {
      if (message.type === 'collect' && validAppSender(location.href))
        window.postMessage(response, APP_ORIGIN);
    })
    .catch(() => {
      if (validAppSender(location.href))
        window.postMessage(
          {
            channel: CTU_CHANNEL,
            type: 'error',
            requestId,
            error: 'Browser helper unavailable. Reload the extension and this page.',
          },
          APP_ORIGIN,
        );
    });
});
