import { logger } from '../shared/utils/logger';

export const setupListeners = () => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    logger.debug('Handling message in listeners', message);
    
    switch (message.type) {
      case 'START_RECORDING':
        // Handle background recording start if needed
        break;
      case 'STOP_RECORDING':
        // Handle background recording stop if needed
        break;
      case 'OPEN_FLOATING_WINDOW':
        chrome.windows.create({
          url: 'popup.html?mode=floating',
          type: 'popup',
          width: 400,
          height: 600
        });
        break;
    }
    
    return true;
  });
};
