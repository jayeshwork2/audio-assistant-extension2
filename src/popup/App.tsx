import React, { useState, useRef, useEffect } from 'react';
import { useAudio } from './hooks/useAudio';
import { useSettings } from './hooks/useSettings';
import { useTranscription } from './hooks/useTranscription';
import { useAIResponse } from './hooks/useAIResponse';
import { useTranslation } from './hooks/useTranslation';
import { useMeeting } from './hooks/useMeeting';
import { useExport } from './hooks/useExport';
import { RecordingControls } from './components/RecordingControls';
import { PermissionRequest } from './components/PermissionRequest';
import { AudioSourceSelector } from './components/AudioSourceSelector';
import { AudioLevelVisualizer } from './components/AudioLevelVisualizer';
import { TranscriptDisplay } from './components/TranscriptDisplay';
import { SettingsPanel } from './components/SettingsPanel';
import { TranscriptHistory } from './components/TranscriptHistory';
import { ProviderIndicator } from './components/ProviderIndicator';
import { AIResponseDisplay } from './components/AIResponseDisplay';
import { ResponseStyleSelector } from './components/ResponseStyleSelector';
import { TranslationPanel } from './components/TranslationPanel';
import { MeetingDetection } from './components/MeetingDetection';
import { ExportPanel } from './components/ExportPanel';
import { Transcript } from '../shared/types/transcription';
import { ResponseMetadata } from '../shared/types/ai-response';
import { TranslationHistoryItem } from '../shared/types/translation';
import { MeetingContext } from '../shared/types/meeting';
import { ExportHistoryItem } from '../shared/types/export';
import './styles/App.css';

export const App: React.FC = () => {
  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  
  const {
    isRecording,
    selectedMode,
    micLevel,
    tabLevel,
    combinedLevel,
    micStatus,
    tabStatus,
    error: audioError,
    permissionStatus,
    permissionError,
    interimTranscript: audioInterim,
    startRecording,
    stopRecording,
    requestMicrophonePermission,
    switchAudioMode,
    audioBlob,
  } = useAudio(settings.audioMode);

  const {
    isTranscribing,
    currentTranscript,
    interimTranscript: transcriptionInterim,
    lastResult,
    error: transcriptionError,
    transcriptionMethod,
    isFallbackUsed,
    startTranscription,
    clearTranscript,
    clearError,
  } = useTranscription();

  const {
    response: aiResponse,
    isGenerating,
    error: aiResponseError,
    metadata: aiResponseMetadata,
    generateResponse,
    retryGeneration,
    clearResponse,
    clearError: clearAIError,
  } = useAIResponse();

  const {
    translatedText,
    isTranslating,
    error: translationError,
    history: translationHistory,
    sourceLanguage,
    targetLanguage,
    translateText,
    detectLanguage,
    setLanguagePair,
    swapLanguages,
    clearHistory: clearTranslationHistory,
    selectHistoryItem: selectTranslationHistoryItem,
    clearError: clearTranslationError,
  } = useTranslation();

  const {
    meetingType,
    domain,
    formality,
    urgency,
    summary,
    keyPoints,
    actionItems,
    isDetecting,
    error: meetingError,
    detectMeetingContext,
    generateMeetingNotes,
    updateMeetingType,
    updateDomain,
    getMeetingContext,
    clearMeetingContext,
    clearError: clearMeetingError,
  } = useMeeting();

  const {
    isExporting,
    exportError,
    lastExportUrl,
    exportHistory,
    exportAsPdf,
    exportAsMarkdown,
    exportAsText,
    emailExport,
    clearExportError,
    openFile,
  } = useExport();

  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedHistoryTranscript, setSelectedHistoryTranscript] = useState<Transcript | null>(null);
  const [selectedResponseStyle, setSelectedResponseStyle] = useState('formal');
  const [conversationId, setConversationId] = useState<string>('');
  const [meetingId, setMeetingId] = useState<string | undefined>();
  const recordingStartTimeRef = useRef<number | null>(null);

  // Generate conversation ID on component mount
  useEffect(() => {
    setConversationId(`conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  // Auto-detect meeting context when transcript is ready
  useEffect(() => {
    if (currentTranscript && currentTranscript.length > 50) {
      const timer = setTimeout(async () => {
        try {
          await detectMeetingContext(currentTranscript);
        } catch (err) {
          console.error('Failed to detect meeting context:', err);
        }
      }, 1000); // Delay to avoid too frequent calls

      return () => clearTimeout(timer);
    }
  }, [currentTranscript, detectMeetingContext]);

  // Auto-generate AI response when transcript is ready
  useEffect(() => {
    if (currentTranscript && currentTranscript.length > 50 && !aiResponse && !isGenerating && !aiResponseError) {
      const timer = setTimeout(async () => {
        try {
          await generateResponse(
            currentTranscript,
            conversationId,
            selectedResponseStyle,
            settings.aiProvider,
            (settings.aiProvider === 'gpt4' ? settings.apiKeys.openai : settings.apiKeys[settings.aiProvider])
          );
        } catch (err) {
          console.error('Failed to generate AI response:', err);
        }
      }, 1500); // Delay to allow for meeting detection

      return () => clearTimeout(timer);
    }
  }, [currentTranscript, conversationId, selectedResponseStyle, settings.aiProvider, generateResponse, aiResponse, isGenerating]);

  const handleStartRecording = async () => {
    recordingStartTimeRef.current = Date.now();
    clearTranscript();
    clearResponse();
    clearMeetingContext();
    setSelectedHistoryTranscript(null);
    await startRecording(selectedMode, settings.language);
  };

  const handleStopRecording = async () => {
    const { blob, transcript: browserTranscript } = await stopRecording();
    
    // Calculate recording duration
    const duration = recordingStartTimeRef.current 
      ? (Date.now() - recordingStartTimeRef.current) / 1000 
      : 0;

    if (blob) {
      try {
        await startTranscription(
          blob,
          settings.language,
          settings.sttProvider,
          duration,
          browserTranscript
        );
      } catch (err) {
        // Error is already handled in useTranscription
        console.error('Transcription failed', err);
      }
    }
  };

  const handleSelectHistoryTranscript = (transcript: Transcript) => {
    setSelectedHistoryTranscript(transcript);
    clearTranscript();
    clearResponse();
    clearMeetingContext();
  };

  const handleStyleChange = (style: string) => {
    setSelectedResponseStyle(style);
    // If we have a current transcript, regenerate with new style
    if (currentTranscript && currentTranscript.length > 50) {
      generateResponse(
        currentTranscript,
        conversationId,
        style,
        settings.aiProvider,
        (settings.aiProvider === 'gpt4' ? settings.apiKeys.openai : settings.apiKeys[settings.aiProvider])
      ).catch(err => {
        console.error('Failed to generate AI response with new style:', err);
      });
    }
  };

  const handleTranslationRequest = async (text: string, sourceLang?: string, targetLang?: string) => {
    try {
      await translateText(text, sourceLang, targetLang);
    } catch (err) {
      console.error('Translation failed:', err);
    }
  };

  const handleSourceChange = (lang: string) => {
    setLanguagePair(lang, targetLanguage);
  };

  const handleTargetChange = (lang: string) => {
    setLanguagePair(sourceLanguage, lang);
  };

  const handleTranslationRequestWrapper = () => {
    if (displayedTranscript) {
      handleTranslationRequest(displayedTranscript);
    }
  };

  const handleSelectTranslationHistoryItem = (item: TranslationHistoryItem) => {
    const index = translationHistory.findIndex(h => h.id === item.id);
    if (index >= 0) {
      selectTranslationHistoryItem(index);
    }
  };

  const handleMeetingContextUpdate = async (updates: Partial<MeetingContext>) => {
    try {
      if (updates.meetingType && updates.meetingType !== meetingType) {
        await updateMeetingType(updates.meetingType);
      }
      if (updates.domain && updates.domain !== domain) {
        await updateDomain(updates.domain);
      }
    } catch (err) {
      console.error('Failed to update meeting context:', err);
    }
  };

  const handleExportPdf = async () => {
    if (meetingId) {
      try {
        await exportAsPdf(meetingId);
      } catch (err) {
        console.error('PDF export failed:', err);
      }
    }
  };

  const handleExportMarkdown = async () => {
    if (meetingId) {
      try {
        await exportAsMarkdown(meetingId);
      } catch (err) {
        console.error('Markdown export failed:', err);
      }
    }
  };

  const handleExportText = async () => {
    if (meetingId) {
      try {
        await exportAsText(meetingId);
      } catch (err) {
        console.error('Text export failed:', err);
      }
    }
  };

  const handleEmailExport = async (email: string, format: 'pdf' | 'markdown' | 'text') => {
    if (meetingId) {
      try {
        await emailExport(meetingId, email, format);
      } catch (err) {
        console.error('Email export failed:', err);
      }
    }
  };

  const displayedTranscript = selectedHistoryTranscript?.transcript || currentTranscript;
  const displayedResult = selectedHistoryTranscript 
    ? {
        transcript: selectedHistoryTranscript.transcript,
        provider: selectedHistoryTranscript.provider,
        confidence: selectedHistoryTranscript.confidence,
        processingTime: 0,
        language: settings.language,
        timestamp: selectedHistoryTranscript.timestamp,
      }
    : lastResult;

  const displayedMethod = selectedHistoryTranscript?.provider || transcriptionMethod;
  const currentInterim = isRecording ? audioInterim : transcriptionInterim;

  // Calculate meeting duration
  const meetingContext = getMeetingContext();
  const duration = meetingContext.duration;

  if (settingsLoading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Audio Assistant</h1>
        <div className="header-actions">
          {(meetingType || domain || formality || urgency) && (
            <div className="meeting-badges">
              {meetingType && (
                <span className="badge meeting-type" title={`Meeting Type: ${meetingType}`}>
                  {meetingType === 'meeting' ? '👥' : 
                   meetingType === 'interview' ? '💼' :
                   meetingType === 'sales' ? '💰' : '📚'} {meetingType}
                </span>
              )}
              {domain && (
                <span className="badge domain" title={`Domain: ${domain}`}>
                  {domain === 'technical' ? '⚙️' :
                   domain === 'business' ? '💼' :
                   domain === 'legal' ? '⚖️' : '🏥'} {domain}
                </span>
              )}
              {urgency && (
                <span className="badge urgency" title={`Urgency: ${urgency}`}>
                  {urgency === 'high' ? '🔴' :
                   urgency === 'medium' ? '🟡' : '🟢'} {urgency}
                </span>
              )}
            </div>
          )}
          <button 
            className={`history-toggle ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
            title="Transcript History"
          >
            📜
          </button>
          <button 
            className={`translation-toggle ${showTranslation ? 'active' : ''}`}
            onClick={() => setShowTranslation(!showTranslation)}
            title="Translation Panel"
          >
            🌍
          </button>
          <button 
            className="settings-toggle" 
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            ⚙️
          </button>
          {!new URLSearchParams(window.location.search).get('mode') && (
            <button
              className="pop-out-button"
              onClick={() => chrome.runtime.sendMessage({ type: 'OPEN_FLOATING_WINDOW' })}
              title="Pop Out"
              style={{ marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ↗️
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {!showSettings ? (
          <div className="main-content">
            <div className="primary-panel">
              <AudioSourceSelector 
                selectedMode={selectedMode}
                onModeChange={(mode) => {
                  switchAudioMode(mode);
                  updateSettings({ audioMode: mode });
                }}
                micStatus={micStatus}
                tabStatus={tabStatus}
              />

              <AudioLevelVisualizer 
                micLevel={micLevel}
                tabLevel={tabLevel}
                combinedLevel={combinedLevel}
                mode={selectedMode}
                isRecording={isRecording}
              />

              <RecordingControls 
                isRecording={isRecording}
                onStart={handleStartRecording}
                onStop={handleStopRecording}
                error={audioError}
                permissionStatus={permissionStatus}
                isTranscribing={isTranscribing}
              />

              {permissionStatus !== 'granted' && (
                <PermissionRequest 
                  permissionError={permissionError}
                  onRetry={requestMicrophonePermission}
                />
              )}

              {(displayedMethod || (displayedResult && !selectedHistoryTranscript)) && (
                <ProviderIndicator 
                  sttProvider={displayedMethod || displayedResult?.provider}
                  aiProvider={settings.aiProvider}
                  isFallback={isFallbackUsed}
                />
              )}

              <TranscriptDisplay 
                transcript={displayedTranscript}
                interimTranscript={currentInterim}
                isRecording={isRecording}
                isTranscribing={isTranscribing}
                transcriptionResult={displayedResult}
                error={transcriptionError}
                onClearError={clearError}
                transcriptionMethod={displayedMethod}
              />

              {/* Response Style Selector */}
              {(displayedTranscript && displayedTranscript.length > 50) && (
                <ResponseStyleSelector
                  selectedStyle={selectedResponseStyle}
                  onStyleChange={handleStyleChange}
                  loading={isGenerating}
                />
              )}

              {/* AI Response Display */}
              {(aiResponse || isGenerating || aiResponseError) && (
                <AIResponseDisplay
                  response={aiResponse}
                  isLoading={isGenerating}
                  error={aiResponseError || undefined}
                  metadata={aiResponseMetadata || undefined}
                  onRetry={retryGeneration}
                  onClearError={clearAIError}
                />
              )}

              {/* Meeting Detection */}
              {(meetingType || domain || formality || urgency || isDetecting) && (
                <MeetingDetection
                  meetingType={meetingType}
                  domain={domain}
                  formality={formality}
                  urgency={urgency}
                  duration={duration}
                  summary={summary}
                  keyPoints={keyPoints}
                  actionItems={actionItems}
                  isDetecting={isDetecting}
                  onUpdate={handleMeetingContextUpdate}
                />
              )}
            </div>

            {/* Side panels */}
            {showHistory && (
              <div className="history-panel">
                <TranscriptHistory 
                  onSelectTranscript={handleSelectHistoryTranscript}
                />
              </div>
            )}

            {showTranslation && (
              <div className="translation-panel">
                <TranslationPanel
                  originalText={displayedTranscript || ''}
                  translatedText={translatedText}
                  isTranslating={isTranslating}
                  sourceLanguage={sourceLanguage}
                  targetLanguage={targetLanguage}
                  error={translationError || undefined}
                  history={translationHistory}
                  onSelectHistoryItem={handleSelectTranslationHistoryItem}
                  onTranslate={handleTranslationRequest}
                  onSourceChange={handleSourceChange}
                  onTargetChange={handleTargetChange}
                  onSwap={swapLanguages}
                  onRetry={handleTranslationRequestWrapper}
                  onClearError={clearTranslationError}
                />
              </div>
            )}

            {/* Export Panel */}
            {displayedTranscript && (
              <div className="export-panel-container">
                <ExportPanel
                  meetingId={meetingId}
                  transcriptText={displayedTranscript}
                  isExporting={isExporting}
                  exportError={exportError || undefined}
                  lastExportUrl={lastExportUrl}
                  onExportPdf={handleExportPdf}
                  onExportMarkdown={handleExportMarkdown}
                  onExportText={handleExportText}
                  onEmailExport={(email, format) => handleEmailExport(email, format as 'pdf' | 'markdown' | 'text')}
                  exportHistory={exportHistory}
                />
              </div>
            )}
          </div>
        ) : (
          <SettingsPanel 
            settings={settings}
            onUpdate={updateSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </main>
    </div>
  );
};
