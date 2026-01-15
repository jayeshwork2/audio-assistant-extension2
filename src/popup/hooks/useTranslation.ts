import { useState, useCallback, useEffect } from 'react';
import { TranslationHistoryItem, TranslationResult, LanguageDetectionResult } from '../../shared/types/translation';
import { apiClient } from '../../shared/services/api-service';
import { storage } from '../../shared/utils/storage';
import { logger } from '../../shared/utils/logger';

export const useTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('en');

  const translateText = useCallback(async (
    text: string,
    sourceLang?: string,
    targetLang?: string
  ): Promise<void> => {
    setIsTranslating(true);
    setError(null);
    
    try {
      logger.info('Starting translation', {
        textLength: text.length,
        sourceLang: sourceLang || 'auto-detect',
        targetLang: targetLang || targetLanguage,
      });

      const request = {
        text,
        sourceLanguage: sourceLang || sourceLanguage,
        targetLanguage: targetLang || targetLanguage,
      };

      const result: TranslationResult = await apiClient.post('/api/translation/translate', request);
      
      setTranslatedText(result.translatedText);
      
      // Add to history
      const historyItem: TranslationHistoryItem = {
        id: Date.now().toString(),
        originalText: text,
        translatedText: result.translatedText,
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage,
        timestamp: result.timestamp,
        provider: result.provider,
      };
      
      const newHistory = [historyItem, ...history].slice(0, 10); // Keep max 10 items
      setHistory(newHistory);
      
      // Save to storage
      await storage.set('translation_history', newHistory);
      
      logger.info('Translation completed successfully', {
        sourceLang: result.sourceLanguage,
        targetLang: result.targetLanguage,
        provider: result.provider,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Translation failed';
      setError(errorMessage);
      logger.error('Translation failed', err);
      throw err;
    } finally {
      setIsTranslating(false);
    }
  }, [sourceLanguage, targetLanguage, history]);

  const detectLanguage = useCallback(async (text: string): Promise<string> => {
    try {
      logger.info('Detecting language', { textLength: text.length });

      const result: LanguageDetectionResult = await apiClient.post('/api/translation/detect', { text });
      
      logger.info('Language detection completed', {
        detectedLanguage: result.language,
        confidence: result.confidence,
      });
      
      return result.language;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Language detection failed';
      logger.error('Language detection failed', err);
      throw new Error(errorMessage);
    }
  }, []);

  const setLanguagePair = useCallback(async (source: string, target: string): Promise<void> => {
    setSourceLanguage(source);
    setTargetLanguage(target);
    
    // Save to preferences
    await storage.set('translation_language_pair', { source, target });
    
    logger.info('Language pair updated', { source, target });
  }, []);

  const swapLanguages = useCallback(async (): Promise<void> => {
    if (sourceLanguage === 'auto') {
      // Can't swap auto-detect
      return;
    }
    
    const newSource = targetLanguage;
    const newTarget = sourceLanguage === 'auto' ? 'en' : sourceLanguage;
    
    await setLanguagePair(newSource, newTarget);
    
    logger.info('Languages swapped', {
      from: { source: sourceLanguage, target: targetLanguage },
      to: { source: newSource, target: newTarget },
    });
  }, [sourceLanguage, targetLanguage, setLanguagePair]);

  const clearHistory = useCallback(async (): Promise<void> => {
    setHistory([]);
    await storage.remove('translation_history');
    
    logger.info('Translation history cleared');
  }, []);

  const deleteHistoryItem = useCallback(async (index: number): Promise<void> => {
    const newHistory = history.filter((_, i) => i !== index);
    setHistory(newHistory);
    await storage.set('translation_history', newHistory);
    
    logger.info('Translation history item deleted', { index });
  }, [history]);

  const selectHistoryItem = useCallback((index: number): void => {
    if (index >= 0 && index < history.length) {
      const item = history[index];
      setTranslatedText(item.translatedText);
      setSourceLanguage(item.sourceLanguage);
      setTargetLanguage(item.targetLanguage);
      
      logger.info('Translation history item selected', { index, item });
    }
  }, [history]);

  const loadHistoryFromStorage = useCallback(async (): Promise<void> => {
    try {
      const storedHistory = await storage.get<TranslationHistoryItem[]>('translation_history');
      if (storedHistory) {
        setHistory(storedHistory);
      }
      
      const storedLanguagePair = await storage.get<{ source: string; target: string }>('translation_language_pair');
      if (storedLanguagePair) {
        setSourceLanguage(storedLanguagePair.source);
        setTargetLanguage(storedLanguagePair.target);
      }
    } catch (err) {
      logger.warn('Failed to load translation preferences from storage', err);
    }
  }, []);

  // Load preferences on mount
  useEffect(() => {
    loadHistoryFromStorage();
  }, [loadHistoryFromStorage]);

  return {
    isTranslating,
    translatedText,
    error,
    history,
    sourceLanguage,
    targetLanguage,
    translateText,
    detectLanguage,
    setLanguagePair,
    swapLanguages,
    clearHistory,
    deleteHistoryItem,
    selectHistoryItem,
    clearError: () => setError(null),
  };
};