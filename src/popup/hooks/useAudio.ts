import { useState, useRef, useEffect } from 'react';
import { AudioMode, AudioSourceStatus } from '../../shared/types/audio';
import { AudioCaptureService } from '../../shared/utils/audio';
import { logger } from '../../shared/utils/logger';
import { useBrowserTranscription } from './useBrowserTranscription';

export const useAudio = (initialMode: AudioMode = 'mic-only') => {
  const {
    transcript: browserTranscript,
    interimTranscript: browserInterim,
    isListening: isBrowserListening,
    error: browserError,
    startListening,
    stopListening,
    resetTranscript
  } = useBrowserTranscription();

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<AudioMode>(initialMode);
  
  const [micLevel, setMicLevel] = useState(0);
  const [tabLevel, setTabLevel] = useState(0);
  const [combinedLevel, setCombinedLevel] = useState(0);

  const [micStatus, setMicStatus] = useState<AudioSourceStatus>('ready');
  const [tabStatus, setTabStatus] = useState<AudioSourceStatus>('ready');

  // Permission state
  const [permissionStatus, setPermissionStatus] = useState<'pending' | 'granted' | 'denied' | 'prompt'>('pending');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [micAvailable, setMicAvailable] = useState<boolean>(true);

  // Transcription state
  const [transcriptionMethod, setTranscriptionMethod] = useState<'browser' | 'groq' | 'failed'>('browser');
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const audioServiceRef = useRef(new AudioCaptureService());
  const animationFrameRef = useRef<number>();

  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    // Check initial recording status with retry
    const checkStatus = async () => {
        let retries = 3;
        while (retries > 0) {
            try {
                logger.debug(`Checking recording status (attempts left: ${retries})...`);
                const response = await chrome.runtime.sendMessage({ type: 'CHECK_RECORDING_STATUS' });
                logger.debug('Recording status response:', response);
                
                if (response && response.isRecording) {
                    setIsRecording(true);
                    if (response.startTime) setStartTime(response.startTime);
                    
                    if (response.mode) {
                        setSelectedMode(response.mode);
                        if (response.mode === 'mic-only' || response.mode === 'mic+tab') setMicStatus('recording');
                        if (response.mode === 'tab-only' || response.mode === 'mic+tab') setTabStatus('recording');
                    }
                    return; // Found it, exit
                }
            } catch (err) {
                logger.error('Failed to check status', err);
            }
            // Wait bit before retry
            retries--;
            if (retries > 0) await new Promise(r => setTimeout(r, 200));
        }
    };
    checkStatus();

    // Check if permission was already granted
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as any }).then(result => {
        if (result.state === 'granted') {
          setPermissionStatus('granted');
        } else if (result.state === 'denied') {
          setPermissionStatus('denied');
        } else {
          setPermissionStatus('prompt');
        }
        
        result.onchange = () => {
          if (result.state === 'granted') setPermissionStatus('granted');
          else if (result.state === 'denied') setPermissionStatus('denied');
          else setPermissionStatus('prompt');
        };
      }).catch(err => {
        logger.error('Error checking permission', err);
      });
    }
  }, []);

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Stop the stream immediately after checking permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionStatus('granted');
      setMicAvailable(true);
      setPermissionError(null);
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setPermissionError("Microphone permission denied. Please enable it in Chrome settings.");
        setPermissionStatus('denied');
      } else if (err.name === 'NotFoundError') {
        setPermissionError("No microphone found on your device.");
        setMicAvailable(false);
        setPermissionStatus('pending');
      } else if (err.name === 'NotSupportedError') {
        setPermissionError("Your browser doesn't support microphone access.");
        setPermissionStatus('pending');
      } else {
        setPermissionError("Failed to access microphone: " + err.message);
        setPermissionStatus('pending');
      }
      return false;
    }
  };

  const startRecording = async (mode?: AudioMode, language: string = 'en-US') => {
    const activeMode = mode || selectedMode;
    setError(null);

    // Check permission first (still doing this locally to trigger prompt)
    if (activeMode !== 'tab-only' && permissionStatus !== 'granted') {
      const granted = await requestMicrophonePermission();
      if (!granted) {
        setError(permissionError || 'Microphone permission required');
        return;
      }
    }

    try {
      // Send message to background to start offscreen recording
      const response = await chrome.runtime.sendMessage({
          type: 'START_RECORDING_REQUEST',
          mode: activeMode,
          language
      });
      
      if (response && response.success === false) {
          throw new Error(response.error);
      }

      setIsRecording(true);
      // startVisualization(); // Visualization disabled for remote recording for now
      
      // Start browser transcription locally if Mic is involved (optional, or rely on offscreen transcription)
      // For now, let's keep local transcription as "backup" or primary for Mic Only if offscreen doesn't handle it yet fully for UI
      if (activeMode !== 'tab-only') {
          setTranscriptionMethod('browser');
          setTranscriptionError(null);
          startListening(language);
      }

      if (activeMode === 'mic-only' || activeMode === 'mic+tab') setMicStatus('recording');
      if (activeMode === 'tab-only' || activeMode === 'mic+tab') setTabStatus('recording');
    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
      logger.error('Recording error', err);
    }
  };

  const stopRecording = async (): Promise<{ blob: Blob | null, transcript: string }> => {
    try {
        // Send stop message
        await chrome.runtime.sendMessage({ type: 'STOP_RECORDING_REQUEST' });
        
        // Wait for data? We need to wait for the RECORDING_COMPLETE message or resolve here?
        // To simplify integration with App.tsx which expects a return value:
        // We might need to wait for a promise that resolves when the message arrives.
        
        // However, we can listen for the message in a global listener or here.
        // Let's create a one-time listener promise
        const audioDataPromise = new Promise<Blob | null>((resolve) => {
             const listener = (message: any) => {
                 if (message.type === 'RECORDING_COMPLETE') {
                     chrome.runtime.onMessage.removeListener(listener);
                     // convert base64 to blob
                     fetch(message.audioData)
                     .then(res => res.blob())
                     .then(resolve)
                     .catch(() => resolve(null));
                 }
             };
             chrome.runtime.onMessage.addListener(listener);
             // Timeout fallback
             setTimeout(() => {
                 chrome.runtime.onMessage.removeListener(listener);
                 resolve(null);
             }, 5000);
        });

      const blob = await audioDataPromise;
      setAudioBlob(blob);
      setIsRecording(false);
      // stopVisualization();
      
      // Stop browser transcription
      stopListening();
      
      setMicStatus('ready');
      setTabStatus('ready');
      return { blob, transcript: browserTranscript };
    } catch (err: any) {
      setError(err.message || 'Failed to stop recording');
      return { blob: null, transcript: '' };
    }
  };

  useEffect(() => {
    setInterimTranscript(browserInterim);
  }, [browserInterim]);

  useEffect(() => {
    if (browserError) {
      setTranscriptionError(browserError);
      setTranscriptionMethod('failed');
    }
  }, [browserError]);

  const startVisualization = () => {
    const audioContext = audioServiceRef.current.getAudioContext();
    if (!audioContext) return;

    const micStream = audioServiceRef.current.getMicrophoneStream();
    const tabStream = audioServiceRef.current.getTabAudioStream();
    const mixedStream = audioServiceRef.current.getMixedStream();

    const createAnalyzer = (stream: MediaStream) => {
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyzer);
      return analyzer;
    };

    const micAnalyzer = micStream ? createAnalyzer(micStream) : null;
    const tabAnalyzer = tabStream ? createAnalyzer(tabStream) : null;
    const mixedAnalyzer = mixedStream ? createAnalyzer(mixedStream) : null;

    const bufferLength = micAnalyzer?.frequencyBinCount || 128;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (micAnalyzer) {
        micAnalyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setMicLevel(Math.round((average / 255) * 100));
      }
      if (tabAnalyzer) {
        tabAnalyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setTabLevel(Math.round((average / 255) * 100));
      }
      if (mixedAnalyzer) {
        mixedAnalyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setCombinedLevel(Math.round((average / 255) * 100));
      }
      animationFrameRef.current = requestAnimationFrame(update);
    };

    update();
  };

  const stopVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setMicLevel(0);
    setTabLevel(0);
    setCombinedLevel(0);
  };

  const switchAudioMode = (newMode: AudioMode) => {
    setSelectedMode(newMode);
    // Logic to update status if needed
  };

  useEffect(() => {
    return () => {
      stopVisualization();
      audioServiceRef.current.resetAudio();
    };
  }, []);

  return {
    isRecording,
    audioBlob,
    error,
    selectedMode,
    micLevel,
    tabLevel,
    combinedLevel,
    micStatus,
    tabStatus,
    permissionStatus,
    permissionError,
    micAvailable,
    transcriptionMethod,
    transcriptionError,
    interimTranscript,
    isTranscribing,
    startRecording,
    stopRecording,
    requestMicrophonePermission,
    switchAudioMode,
    startTime,
    resetAudio: () => audioServiceRef.current.resetAudio(),
  };
};
