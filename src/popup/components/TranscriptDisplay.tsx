import React from 'react';
import { TranscriptionResult } from '../../shared/types/transcription';

interface Props {
  transcript: string;
  interimTranscript?: string;
  isRecording: boolean;
  isTranscribing?: boolean;
  transcriptionResult?: TranscriptionResult | null;
  error?: string | null;
  onClearError?: () => void;
  transcriptionMethod?: string;
}

export const TranscriptDisplay: React.FC<Props> = ({
  transcript,
  interimTranscript = '',
  isRecording,
  isTranscribing = false,
  transcriptionResult = null,
  error = null,
  onClearError,
  transcriptionMethod,
}) => {
  const formatProcessingTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusMessage = (): string => {
    if (isRecording) return 'Recording...';
    if (isTranscribing) return 'Transcribing...';
    if (error) return 'Transcription failed';
    if (transcript) return 'Transcription complete';
    return 'No transcript yet';
  };

  const provider = transcriptionMethod || transcriptionResult?.provider || '';
  const confidence = transcriptionResult?.confidence || 0;

  return (
    <div className="transcript-display">
      <div className="transcript-header">
        <h4>Transcript</h4>
        <div className="header-meta">
          {provider && (
            <span className={`method-badge ${provider.toLowerCase()}`}>
              {provider.includes('browser') ? '🌐 Browser STT' : '⚡ Groq STT'}
            </span>
          )}
          <span className="transcript-status">{getStatusMessage()}</span>
        </div>
      </div>

      {error && (
        <div className="transcript-error">
          <span className="error-message">{error}</span>
          {onClearError && (
            <button className="error-dismiss" onClick={onClearError} aria-label="Dismiss error">
              ✕
            </button>
          )}
        </div>
      )}

      {isTranscribing && (
        <div className="transcript-loading">
          <div className="spinner" />
          <span>Processing audio...</span>
        </div>
      )}

      {transcriptionResult && !isTranscribing && (
        <div className="transcript-metadata">
          <div className="metadata-item">
            <span className="metadata-label">Provider:</span>
            <span className="metadata-value">{transcriptionResult.provider}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Confidence:</span>
            <span className="metadata-value">
              {(transcriptionResult.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Processing Time:</span>
            <span className="metadata-value">
              {formatProcessingTime(transcriptionResult.processingTime)}
            </span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Language:</span>
            <span className="metadata-value">{transcriptionResult.language}</span>
          </div>
        </div>
      )}

      <div className="transcript-content">
        {transcript}
        {interimTranscript && (
          <span className="interim-text"> {interimTranscript}</span>
        )}
        {!transcript && !interimTranscript && (isRecording ? 'Listening...' : 'No transcript yet.')}
      </div>

      {transcript && !isTranscribing && (
        <button
          className="copy-button"
          onClick={() => navigator.clipboard.writeText(transcript)}
        >
          📋 Copy to Clipboard
        </button>
      )}
    </div>
  );
};
