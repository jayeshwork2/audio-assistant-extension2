import { useState, useRef, useCallback, useEffect } from 'react';

interface UseBrowserTranscriptionReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  error?: string;
  confidence: number;
  language: string;
  isSupported: boolean;
  isFallbackNeeded: boolean;
  startListening: (language: string) => void;
  stopListening: () => void;
  resetTranscript: () => void;
  setLanguage: (lang: string) => void;
}

export const useBrowserTranscription = (): UseBrowserTranscriptionReturn => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [confidence, setConfidence] = useState(0);
  const [language, setLanguage] = useState('en-US');
  const [isFallbackNeeded, setIsFallbackNeeded] = useState(false);

  const recognitionRef = useRef<any>(null);

  const isSupported = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    if (!isSupported) {
      setError('Web Speech API is not supported in this browser.');
      setIsFallbackNeeded(true);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
          setConfidence(event.results[i][0].confidence);
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) {
        setTranscript((prev) => prev + (prev ? ' ' : '') + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setIsFallbackNeeded(true);
      }
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      // If we are still supposed to be listening, restart the recognition
      // We need to check a ref instead of state to get the latest value without closure stale issues
      if (recognitionRef.current && !recognitionRef.current.stoppedExplicitly) {
        try {
          recognition.start();
          return;
        } catch (e) {
            // Ignore error if already started
        }
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [isSupported, language]);

  const startListening = useCallback((lang: string) => {
    if (!recognitionRef.current) return;
    
    setLanguage(lang);
    recognitionRef.current.lang = lang;
    
    try {
      setTranscript('');
      setInterimTranscript('');
      setError(undefined);
      setIsFallbackNeeded(false);
      recognitionRef.current.stoppedExplicitly = false;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start speech recognition', err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stoppedExplicitly = true;
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Failed to stop speech recognition', err);
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    error,
    confidence,
    language,
    isSupported,
    isFallbackNeeded,
    startListening,
    stopListening,
    resetTranscript,
    setLanguage,
  };
};
