import { AudioCaptureService } from '../shared/utils/audio';
import { logger } from '../shared/utils/logger';

// Types for messages
type OffscreenMessage = 
  | { type: 'START_RECORDING', streamId?: string, mode: 'mic-only' | 'tab-only' | 'mic+tab', language?: string }
  | { type: 'STOP_RECORDING' }
  | { type: 'CHECK_STATUS' };

const audioService = new AudioCaptureService();
let isRecording = false;
let currentMode: 'mic-only' | 'tab-only' | 'mic+tab' = 'mic-only';
let recordingStartTime: number | null = null;

// Initialize transcription (will be implemented in AudioCaptureService or here)
// For now, AudioCaptureService handles the bulk of it as per our plan, 
// or we adapt AudioCaptureService to be used here. 

// We need to listen to messages from the background script
chrome.runtime.onMessage.addListener(async (message: OffscreenMessage, sender, sendResponse) => {
  logger.debug('Offscreen received message', message);

  try {
    if (message.type === 'START_RECORDING') {
        if (isRecording) {
            sendResponse({ success: false, error: 'Already recording' });
            return;
        }

        await audioService.startRecording(message.mode, message.streamId);
        isRecording = true;
        currentMode = message.mode;
        recordingStartTime = Date.now();
        
        // Start transcription if needed (Mic based)
        // Note: AudioCaptureService currently has mixer logic. 
        // We will need to update AudioCaptureService to support passing streamId provided by background
        
        sendResponse({ success: true });
    } else if (message.type === 'STOP_RECORDING') {
        if (!isRecording) {
            sendResponse({ success: false, error: 'Not recording' });
            return;
        }

        const blob = await audioService.stopRecording();
        isRecording = false;
        recordingStartTime = null;

        // Convert Blob to base64 to send back to background/popup? 
        // Or store it in indexedDB?
        // Blobs can't be sent directly via sendMessage easily if large.
        // Better to use a FileReader to get base64 or ArrayBuffer.
        
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
             const base64data = reader.result;
             // Send back to runtime
             chrome.runtime.sendMessage({ 
                 type: 'RECORDING_COMPLETE', 
                 audioData: base64data 
             });
        };

        sendResponse({ success: true });
    } else if (message.type === 'CHECK_STATUS') {
        sendResponse({ isRecording, mode: currentMode, startTime: recordingStartTime });
    }
  } catch (err: any) {
    logger.error('Offscreen error', err);
    sendResponse({ success: false, error: err.message });
  }
  
  return true; // Keep channel open for async response
});

// Helper to keep the document alive if needed, though offscreen docs have different lifecycle rules.
setInterval(() => {
    chrome.runtime.sendMessage({ type: 'OFFSCREEN_PING' });
}, 30000);
