import React, { useState, useEffect } from 'react';
import { ResponseMetadata } from '../../shared/types/ai-response';
import './AIResponseDisplay.css';

interface AIResponseDisplayProps {
  response: string;
  isLoading: boolean;
  error?: string;
  metadata?: ResponseMetadata;
  onRetry?: () => void;
  onClearError?: () => void;
}

export const AIResponseDisplay: React.FC<AIResponseDisplayProps> = ({
  response,
  isLoading,
  error,
  metadata,
  onRetry,
  onClearError,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Typewriter animation
  useEffect(() => {
    if (!response || isAnimating) return;

    setIsAnimating(true);
    setDisplayedText('');
    
    const words = response.split(' ');
    let currentIndex = 0;
    
    const typeNextWord = () => {
      if (currentIndex < words.length) {
        const word = words[currentIndex];
        setDisplayedText(prev => {
          const newText = currentIndex === 0 
            ? word 
            : prev + ' ' + word;
          return newText;
        });
        currentIndex++;
        setTimeout(typeNextWord, 75); // ~75ms per word for smooth animation
      } else {
        setIsAnimating(false);
      }
    };
    
    typeNextWord();
  }, [response]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(response);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading && !response) {
    return (
      <div className="ai-response-display loading-state">
        <div className="response-header">
          <h3>AI Response</h3>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Generating response...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-response-display error-state">
        <div className="response-header">
          <h3>AI Response</h3>
        </div>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            {onRetry && (
              <button 
                className="retry-button"
                onClick={onRetry}
                disabled={isLoading}
              >
                {isLoading ? 'Retrying...' : 'Retry'}
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
      </div>
    );
  }

  if (!response) {
    return null;
  }

  return (
    <div className="ai-response-display">
      <div className="response-header">
        <h3>AI Response</h3>
        <button 
          className="copy-button"
          onClick={copyToClipboard}
          title="Copy to clipboard"
        >
          {copySuccess ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>

      <div className="response-content">
        <div className="response-text">
          {displayedText}
          {isAnimating && <span className="cursor">|</span>}
        </div>
      </div>

      {metadata && (
        <div className="response-metadata">
          <div className="metadata-grid">
            <div className="metadata-item">
              <span className="metadata-label">Provider:</span>
              <span className="metadata-value">{metadata.provider}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Tokens:</span>
              <span className="metadata-value">{metadata.tokensUsed}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Style:</span>
              <span className="metadata-value">{metadata.style}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Time:</span>
              <span className="metadata-value">{formatTimestamp(metadata.timestamp)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};