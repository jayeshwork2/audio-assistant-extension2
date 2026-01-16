import { useState, useCallback } from 'react';
import { TranscriptionResult } from '../../shared/types/transcription';
import { STTProviderType } from '../../shared/types/providers';
import { transcriptionClient } from '../../shared/services/transcription-client';
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
  const [transcriptionMethod, setTranscriptionMethod] = useState<'browser' | 'groq' | ''>('');
  const [isFallbackUsed, setIsFallbackUsed] = useState(false);
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
    setIsFallbackUsed(false);
    
    try {
      // Step 1: Use browser transcript if available and no specific provider requested
      // Step 1: Use browser transcript if available and no specific provider requested
      if (!sttProvider || sttProvider === 'browser') {
        // If we have text OR if the user explicitly requested 'browser', we stop here.
        // This prevents falling back to the backend if the user only wanted browser STT but got silence.
        if (existingBrowserTranscript || browserTranscript || sttProvider === 'browser') {
          const finalTranscript = existingBrowserTranscript || browserTranscript || '';
          
          setCurrentTranscript(finalTranscript);
          setTranscriptionMethod('browser');
          setConfidence(browserConfidence || 0.9); // Web Speech API doesn't always provide confidence
          
          const result: TranscriptionResult = {
            transcript: finalTranscript,
            confidence: browserConfidence || 0.9,
            provider: 'browser',
            processingTime: 0,
            language,
            timestamp: new Date()
          };
          setLastResult(result);

          if (finalTranscript && audioDuration !== undefined) {
             // Only save to history if we actually have text
             await transcriptHistoryService.addTranscript(result, audioDuration);
          }
          setIsTranscribing(false);
          return;
        }
      }

      // Step 2: Fallback to Groq if browser failed or Groq explicitly requested
      setTranscriptionMethod('groq');
      setIsFallbackUsed(!!existingBrowserTranscript || !!browserTranscript);
      
      const result = await transcriptionClient.transcribeAudio(
        audioData,
        language,
        sttProvider || STTProviderType.GROQ
      );

      setCurrentTranscript(result.transcript);
      setLastResult(result);
      setConfidence(result.confidence);

      if (audioDuration !== undefined) {
        await transcriptHistoryService.addTranscript(result, audioDuration);
      }
    } catch (err: any) {
      setError(err.message || 'Transcription failed');
      setTranscriptionMethod('');
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
    setTranscriptionMethod('');
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
    isFallbackUsed,
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
