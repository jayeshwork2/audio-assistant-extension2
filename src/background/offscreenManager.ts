
const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

export const setupOffscreenDocument = async (path: string) => {
  // Check if offscreen document already exists
  // simplify check: assuming only one offscreen doc is ever used by this extension for now.
  const existingContexts = await (chrome.runtime as any).getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });

  if (existingContexts.length > 0) {
    return;
  }

  // Create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['AUDIO_PLAYBACK', 'USER_MEDIA'] as any,
      justification: 'Recording tab audio and microphone in the background'
    });
    
    // catch error if race condition
    await creating.catch(err => {
        if (!err.message.includes('Only a single offscreen document may be created')) {
            throw err;
        }
    });

    creating = null;
  }
};

let creating: Promise<void> | null = null;

export const hasOffscreenDocument = async (path: string) => {
    const existingContexts = await (chrome.runtime as any).getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [path]
    });
    return existingContexts.length > 0;
};

export const closeOffscreenDocument = async () => {
    await chrome.offscreen.closeDocument();
};
