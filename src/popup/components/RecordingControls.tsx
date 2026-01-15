import React, { useState, useEffect } from 'react';

interface Props {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  error: string | null;
  permissionStatus?: 'pending' | 'granted' | 'denied' | 'prompt';
  isTranscribing?: boolean;
}

export const RecordingControls: React.FC<Props> = ({
  isRecording,
  onStart,
  onStop,
  error,
  permissionStatus,
  isTranscribing = false
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return [hrs, mins, secs].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const getStatusMessage = () => {
    if (isRecording) return '● Recording';
    if (isTranscribing) return 'Processing...';
    if (permissionStatus === 'denied') return '❌ Permission Denied';
    if (error) return '⚠️ Error';
    return 'Ready to record';
  };

  return (
    <div className="recording-controls">
      <div className={`status-indicator ${isRecording ? 'pulsing' : ''}`}>
        {getStatusMessage()}
      </div>
      
      <div className="timer">{formatTime(seconds)}</div>

      <button 
        className={`record-button ${isRecording ? 'stop' : 'start'}`}
        onClick={isRecording ? onStop : onStart}
        disabled={isTranscribing}
      >
        {isRecording ? 'Stop Recording' : (isTranscribing ? 'Processing...' : 'Start Recording')}
      </button>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};
