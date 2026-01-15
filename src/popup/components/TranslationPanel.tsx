import React, { useState } from 'react';
import { TranslationHistoryItem } from '../../shared/types/translation';
import { LanguagePairSelector } from './LanguagePairSelector';
import './TranslationPanel.css';

interface TranslationPanelProps {
  originalText: string;
  translatedText?: string;
  isTranslating: boolean;
  sourceLanguage: string;
  targetLanguage: string;
  error?: string;
  history?: TranslationHistoryItem[];
  onSelectHistoryItem?: (item: TranslationHistoryItem) => void;
  onTranslate?: (text: string, sourceLang?: string, targetLang?: string) => void;
  onSourceChange?: (lang: string) => void;
  onTargetChange?: (lang: string) => void;
  onSwap?: () => void;
  onRetry?: () => void;
  onClearError?: () => void;
}

export const TranslationPanel: React.FC<TranslationPanelProps> = ({
  originalText,
  translatedText,
  isTranslating,
  sourceLanguage,
  targetLanguage,
  error,
  history = [],
  onSelectHistoryItem,
  onTranslate,
  onSourceChange,
  onTargetChange,
  onSwap,
  onRetry,
  onClearError,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleTranslate = () => {
    if (onTranslate && originalText) {
      onTranslate(originalText, sourceLanguage, targetLanguage);
    }
  };

  const copyToClipboard = async () => {
    if (translatedText) {
      try {
        await navigator.clipboard.writeText(translatedText);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getLanguageName = (code: string) => {
    const languageMap: { [key: string]: string } = {
      'auto': 'Auto-detect',
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi',
      // Add more as needed
    };
    return languageMap[code] || code;
  };

  if (!originalText) {
    return (
      <div className="translation-panel empty-state">
        <h4>Translation</h4>
        <p className="empty-message">Transcribe some audio first to enable translation</p>
      </div>
    );
  }

  return (
    <div className="translation-panel">
      <div className="panel-header">
        <h4>Translation</h4>
        <button 
          className={`history-toggle ${showHistory ? 'active' : ''}`}
          onClick={() => setShowHistory(!showHistory)}
          title="Translation History"
        >
          📜 {history.length > 0 && `(${history.length})`}
        </button>
      </div>

      <LanguagePairSelector
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        onSourceChange={onSourceChange || (() => {})}
        onTargetChange={onTargetChange || (() => {})}
        onSwap={onSwap || (() => {})}
        disabled={isTranslating}
      />

      <div className="translation-content">
        <div className="text-panels">
          {/* Original Text Panel */}
          <div className="text-panel original-panel">
            <div className="panel-title">
              <span className="language-label">
                🇺🇸 {getLanguageName(sourceLanguage)}
              </span>
            </div>
            <div className="text-content">
              {originalText}
            </div>
          </div>

          {/* Translated Text Panel */}
          <div className="text-panel translated-panel">
            <div className="panel-title">
              <span className="language-label">
                🇪🇸 {getLanguageName(targetLanguage)}
              </span>
              {translatedText && (
                <button 
                  className="copy-button"
                  onClick={copyToClipboard}
                  title="Copy translated text"
                >
                  {copySuccess ? '✓ Copied!' : '📋 Copy'}
                </button>
              )}
            </div>
            <div className="text-content">
              {isTranslating ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <span>Translating...</span>
                </div>
              ) : error ? (
                <div className="error-container">
                  <div className="error-icon">⚠️</div>
                  <p className="error-message">{error}</p>
                  <div className="error-actions">
                    {onRetry && (
                      <button 
                        className="retry-button"
                        onClick={onRetry}
                        disabled={isTranslating}
                      >
                        {isTranslating ? 'Retrying...' : 'Retry'}
                      </button>
                    )}
                    {onClearError && (
                      <button 
                        className="dismiss-button"
                        onClick={onClearError}
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              ) : translatedText ? (
                translatedText
              ) : (
                <div className="empty-translation">
                  <p>No translation yet</p>
                  <button 
                    className="translate-button"
                    onClick={handleTranslate}
                    disabled={isTranslating || !originalText}
                  >
                    {isTranslating ? 'Translating...' : 'Translate'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Translation History */}
        {showHistory && history.length > 0 && (
          <div className="translation-history">
            <h5>Recent Translations</h5>
            <div className="history-list">
              {history.map((item, index) => (
                <div 
                  key={item.id}
                  className="history-item"
                  onClick={() => onSelectHistoryItem?.(item)}
                >
                  <div className="history-languages">
                    {item.sourceLanguage} → {item.targetLanguage}
                  </div>
                  <div className="history-preview">
                    {item.translatedText.length > 50 
                      ? `${item.translatedText.substring(0, 50)}...` 
                      : item.translatedText
                    }
                  </div>
                  <div className="history-meta">
                    <span className="history-provider">{item.provider}</span>
                    <span className="history-time">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Translate Button (when not translating) */}
        {!isTranslating && !error && !translatedText && (
          <div className="translate-actions">
            <button 
              className="translate-button primary"
              onClick={handleTranslate}
              disabled={!originalText}
            >
              Translate to {getLanguageName(targetLanguage)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};