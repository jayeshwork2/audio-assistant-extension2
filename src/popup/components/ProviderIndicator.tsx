import React from 'react';
import { STTProviderType, AIProviderType } from '../../shared/types/providers';

interface Props {
  sttProvider?: string;
  aiProvider?: AIProviderType;
  isFallback?: boolean;
}

export const ProviderIndicator: React.FC<Props> = ({
  sttProvider,
  aiProvider,
  isFallback = false,
}) => {
  const getProviderBadgeClass = (provider: string): string => {
    const lowerProvider = provider.toLowerCase();
    
    if (lowerProvider.includes('browser')) {
      return 'provider-badge provider-primary';
    }
    
    if (lowerProvider.includes('groq') && !isFallback) {
      return 'provider-badge provider-primary';
    }
    
    if (isFallback) {
      return 'provider-badge provider-fallback';
    }
    
    if (lowerProvider.includes('custom') || lowerProvider.includes('user')) {
      return 'provider-badge provider-custom';
    }
    
    return 'provider-badge provider-default';
  };

  const getProviderIcon = (provider: string): string => {
    const lowerProvider = provider.toLowerCase();
    
    if (lowerProvider.includes('browser')) return '🌐';
    if (lowerProvider.includes('groq')) return '⚡';
    if (lowerProvider.includes('whisper')) return '🎤';
    if (lowerProvider.includes('openai')) return '🤖';
    if (lowerProvider.includes('claude')) return '🧠';
    if (lowerProvider.includes('gemini')) return '✨';
    if (lowerProvider.includes('gpt')) return '🤖';
    
    return '📝';
  };

  const getProviderDisplayName = (provider: string): string => {
    const lowerProvider = provider.toLowerCase();
    
    if (lowerProvider.includes('browser')) return 'Browser STT';
    if (lowerProvider.includes('groq_whisper') || lowerProvider === 'groq') return 'Groq Whisper';
    if (lowerProvider.includes('whisper_cpp')) return 'Whisper.cpp';
    if (lowerProvider.includes('openai')) return 'OpenAI Whisper';
    if (lowerProvider.includes('claude')) return 'Claude';
    if (lowerProvider.includes('gemini')) return 'Gemini';
    if (lowerProvider.includes('gpt-4')) return 'GPT-4';
    if (lowerProvider.includes('gpt')) return 'GPT';
    
    return provider;
  };

  const getTooltipText = (): string => {
    let tooltip = '';
    
    if (sttProvider) {
      tooltip += `Speech-to-Text: ${getProviderDisplayName(sttProvider)}`;
      if (isFallback) {
        tooltip += ' (Fallback)';
      }
    }
    
    if (aiProvider) {
      if (tooltip) tooltip += ' | ';
      tooltip += `AI: ${aiProvider}`;
    }
    
    return tooltip || 'No provider information';
  };

  if (!sttProvider && !aiProvider) {
    return null;
  }

  return (
    <div className="provider-indicator" title={getTooltipText()}>
      {sttProvider && (
        <div className={getProviderBadgeClass(sttProvider)}>
          <span className="provider-icon">{getProviderIcon(sttProvider)}</span>
          <span className="provider-name">{getProviderDisplayName(sttProvider)}</span>
          {isFallback && <span className="fallback-indicator">⚠️</span>}
        </div>
      )}
      
      {aiProvider && (
        <div className="provider-badge provider-ai">
          <span className="provider-icon">{getProviderIcon(aiProvider)}</span>
          <span className="provider-name">{aiProvider}</span>
        </div>
      )}
    </div>
  );
};
