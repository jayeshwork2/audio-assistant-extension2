import { logger } from '../shared/utils/logger';

import { setupOffscreenDocument } from './offscreenManager';

export const setupListeners = () => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    logger.debug('Handling message in listeners', message);
    
    const handleMessage = async () => {
        try {
            switch (message.type) {
                case 'START_RECORDING_REQUEST':
                    await setupOffscreenDocument('offscreen.html');
                    
                    let streamId: string | undefined;
                    if (message.mode === 'tab-only' || message.mode === 'mic+tab') {
                        // Get the media stream ID for the *active* tab
                         const tab = await chrome.tabs.query({ active: true, currentWindow: true });
                         if (tab[0]?.id) {
                            streamId = await new Promise<string>((resolve) => {
                                chrome.tabCapture.getMediaStreamId({ targetTabId: tab[0]!.id }, (streamId) => {
                                    resolve(streamId);
                                });
                            });
                         }
                    }

                    // Forward to offscreen
                    const startResponse = await chrome.runtime.sendMessage({
                        type: 'START_RECORDING',
                        mode: message.mode,
                        streamId,
                        language: message.language
                    });
                    
                    return startResponse;

                case 'STOP_RECORDING_REQUEST':
                     // Forward to offscreen
                    const stopResponse = await chrome.runtime.sendMessage({
                        type: 'STOP_RECORDING'
                    });
                    return stopResponse; // Should contain audioData
                
                case 'CHECK_RECORDING_STATUS':
                    logger.debug('Received CHECK_RECORDING_STATUS');
                    try {
                        // Directly try to ping the offscreen document
                        // If it doesn't exist or doesn't answer, this will throw or return undefined
                        const statusResponse = await chrome.runtime.sendMessage({
                            type: 'CHECK_STATUS'
                        });
                        logger.debug('Offscreen status response:', statusResponse);
                        return statusResponse;
                    } catch (e) {
                         logger.debug('Failed to reach offscreen (likely not running)', e);
                         return { isRecording: false };
                    }

                case 'OPEN_FLOATING_WINDOW':
                    chrome.windows.create({
                    url: 'popup.html?mode=floating',
                    type: 'popup',
                    width: 400,
                    height: 600
                    });
                    return { success: true };
            }
        } catch (err: any) {
             logger.error('Error in background listener', err);
             return { success: false, error: err.message };
        }
    };

    handleMessage().then(sendResponse);
    return true;
  });
};

