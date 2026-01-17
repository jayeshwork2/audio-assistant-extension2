import { useState, useCallback } from 'react';
import { TranscriptionResult } from '../../shared/types/transcription';
import { STTProviderType } from '../../shared/types/providers';
import { transcriptHistoryService } from '../../shared/services/transcript-history-service';
import { logger } from '../../shared/utils/logger';
import { useBrowserTranscription } from './useBrowserTranscription';

export const useTranscription = () => {
  const {
    transcript: browserTranscript,
    interimTranscript,
    isListening: isBrowserListening,
    error: browserError,
    confidence: browserConfidence,
    isSupported: isBrowserSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useBrowserTranscription();

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastResult, setLastResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionMethod, setTranscriptionMethod] = useState<'browser'>('browser');
  const [confidence, setConfidence] = useState(0);

  const startTranscription = async (
    audioData: Blob,
    language: string,
    sttProvider?: STTProviderType,
    audioDuration?: number,
    existingBrowserTranscript?: string
  ): Promise<void> => {
    setIsTranscribing(true);
    setError(null);
    
    try {
      // Always use browser transcript (or what was captured by browser STT)
      const finalTranscript = existingBrowserTranscript || browserTranscript || '';
      
      setCurrentTranscript(finalTranscript);
      setTranscriptionMethod('browser');
      setConfidence(browserConfidence || 0.9);
      
      const result: TranscriptionResult = {
        transcript: finalTranscript,
        confidence: browserConfidence || 0.9,
        provider: sttProvider || 'browser',
        processingTime: 0,
        language,
        timestamp: new Date()
      };
      setLastResult(result);

      if (finalTranscript && audioDuration !== undefined) {
          await transcriptHistoryService.addTranscript(result, audioDuration);
      }
      setIsTranscribing(false);
    } catch (err: any) {
      setError(err.message || 'Transcription failed');
      logger.error('Transcription error', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const stopTranscription = (): void => {
    setIsTranscribing(false);
  };

  const clearTranscript = (): void => {
    setCurrentTranscript('');
    setLastResult(null);
  };

  const clearError = (): void => {
    setError(null);
  };

  return {
    isTranscribing,
    currentTranscript,
    interimTranscript,
    lastResult,
    error,
    transcriptionMethod,
    confidence,
    isBrowserListening,
    isBrowserSupported,
    browserError,
    startTranscription,
    stopTranscription,
    clearTranscript,
    clearError,
    startListening,
    stopListening,
    resetTranscript
  };
};
