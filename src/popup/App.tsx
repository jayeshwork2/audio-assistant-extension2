
import React, { useState, useRef, useEffect } from 'react';
import { useAudio } from './hooks/useAudio';
import { useSettings } from './hooks/useSettings';
import { useTranscription } from './hooks/useTranscription';
import { useAIResponse } from './hooks/useAIResponse';
import { RecordingControls } from './components/RecordingControls';
import { PermissionRequest } from './components/PermissionRequest';
import { AudioSourceSelector } from './components/AudioSourceSelector';
import { AudioLevelVisualizer } from './components/AudioLevelVisualizer';
import { TranscriptDisplay } from './components/TranscriptDisplay';
import { SettingsPanel } from './components/SettingsPanel';
import { TranscriptHistory } from './components/TranscriptHistory';
import { AIResponseDisplay } from './components/AIResponseDisplay';
import { ResponseStyleSelector } from './components/ResponseStyleSelector';
import { Transcript } from '../shared/types/transcription';
import { GroqService } from '../shared/services/groq-service';
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
    startTime,
  } = useAudio(settings.audioMode);

  const {
    isTranscribing,
    currentTranscript,
    interimTranscript: transcriptionInterim,
    lastResult,
    error: transcriptionError,
    transcriptionMethod,
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



  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryTranscript, setSelectedHistoryTranscript] = useState<Transcript | null>(null);
  const [selectedResponseStyle, setSelectedResponseStyle] = useState('formal');
  const [conversationId, setConversationId] = useState<string>('');
  const [meetingId] = useState<string | undefined>(undefined); // kept for potential future use or removed if fully unused
  const recordingStartTimeRef = useRef<number | null>(null);

  // Generate conversation ID on component mount
  useEffect(() => {
    setConversationId(`conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  // Removed auto-detect meeting context effect

  // Auto-generate AI response when transcript is ready
  useEffect(() => {
    if (currentTranscript && currentTranscript.length > 10 && !aiResponse && !isGenerating && !aiResponseError) {
      const timer = setTimeout(async () => {
        try {
          await generateResponse(
            currentTranscript,
            conversationId,
            selectedResponseStyle,
            settings.aiProvider,
            (settings.aiProvider === 'gpt4' ? settings.apiKeys.openai : settings.apiKeys[settings.aiProvider as keyof typeof settings.apiKeys]),
            settings.userContext,
            settings.responseLanguage
          );
        } catch (err) {
          console.error('Failed to generate AI response:', err);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [currentTranscript, conversationId, selectedResponseStyle, settings.aiProvider, generateResponse, aiResponse, isGenerating, settings.apiKeys, settings.userContext, settings.responseLanguage]);

  // Move displayedTranscript definition up to be available for handlers
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

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleStartRecording = async () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    recordingStartTimeRef.current = Date.now();
    clearTranscript();
    clearResponse();
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
      // Create download URL
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      try {
        let finalTranscript = browserTranscript;
        let providerUsed = 'browser';

        // Use Groq if available and appropriate (Tab audio involved or Groq preferred)
        // For Tab modes, browser transcript is likely empty/partial, so Groq is essential.
        if ((selectedMode === 'tab-only' || selectedMode === 'mic+tab') && settings.apiKeys.groq) {
           try {
             // Show processing state? useTranscription has isTranscribing state but startTranscription sets it.
             // We can manually call startTranscription below with the blob, but we want to substitute the transcript content.
             // Actually startTranscription takes a blob and *optionally* a transcript.
             // We should let startTranscription handle it if we modify it to support an external fetch?
             // Or fetch here and pass the result.
             
             // We'll modify the flow to fetch Groq here:
             const groqTranscript = await GroqService.transcribeAudio(blob, settings.apiKeys.groq, settings.language);
             if (groqTranscript) {
                 finalTranscript = groqTranscript;
                 providerUsed = 'groq';
             }
           } catch (groqErr) {
               console.error('Groq transcription failed, falling back to browser transcript', groqErr);
           }
        }

        await startTranscription(
          blob,
          settings.language,
          providerUsed as any, // Cast to STTProviderType
          duration,
          finalTranscript 
        );
        if (finalTranscript && finalTranscript.length > 5) {
            try {
                // Explicitly trigger AI response
                await generateResponse(
                    finalTranscript,
                    conversationId,
                    selectedResponseStyle,
                    settings.aiProvider,
                    (settings.aiProvider === 'gpt4' ? settings.apiKeys.openai : settings.apiKeys[settings.aiProvider as keyof typeof settings.apiKeys]),
                    settings.userContext,
                    settings.responseLanguage
                );
            } catch (aiErr) {
                console.error('Auto-generate AI response failed:', aiErr);
                // The error state in useAIResponse should handle the UI display
            }
        }
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
        (settings.aiProvider === 'gpt4' ? settings.apiKeys.openai : settings.apiKeys[settings.aiProvider as keyof typeof settings.apiKeys]),
        settings.userContext,
        settings.responseLanguage
      ).catch(err => {
        console.error('Failed to generate AI response with new style:', err);
      });
    }
  };



  if (settingsLoading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Audio Assistant</h1>
        <div className="header-actions">
          <button 
            className={`history-toggle ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
            title="Transcript History"
          >
            📜
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
                startTime={startTime}
              />

              {downloadUrl && (
                <div className="download-section" style={{ textAlign: 'center', marginTop: '10px' }}>
                  <a 
                    href={downloadUrl} 
                    download={`recording-${new Date().toISOString()}.webm`}
                    className="download-link"
                    style={{ 
                        display: 'inline-block', 
                        padding: '8px 16px', 
                        background: '#4CAF50', 
                        color: 'white', 
                        textDecoration: 'none', 
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                  >
                    💾 Download Recording
                  </a>
                </div>
              )}

              {permissionStatus !== 'granted' && (
                <PermissionRequest 
                  permissionError={permissionError}
                  onRetry={requestMicrophonePermission}
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
            </div>

            {/* Side panels */}
            {showHistory && (
              <div className="history-panel">
                <TranscriptHistory 
                  onSelectTranscript={handleSelectHistoryTranscript}
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
