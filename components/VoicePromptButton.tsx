import React, { useState, useEffect, useRef } from 'react';
import MicrophoneIcon from './icons/MicrophoneIcon';

// FIX: Add type definitions for the Speech Recognition API to resolve 'Cannot find name' errors.
interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start(): void;
  stop(): void;
}

// Extend the Window interface to include webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

interface VoicePromptButtonProps {
  onTranscript: (transcript: string) => void;
  disabled: boolean;
}

const VoicePromptButton: React.FC<VoicePromptButtonProps> = ({ onTranscript, disabled }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition is not supported by this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      onTranscript(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    // Cleanup function
    return () => {
      recognition.stop();
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (disabled || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  if (!recognitionRef.current) {
    return null; // Don't render if SpeechRecognition is not supported
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={`absolute top-3 right-3 p-2 rounded-full transition-colors duration-200
        ${disabled ? 'text-slate-600' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}
        ${isListening ? '!text-red-500 animate-pulse' : ''}`
      }
      aria-label={isListening ? 'Stop listening' : 'Start voice prompt'}
    >
      <MicrophoneIcon />
    </button>
  );
};

export default VoicePromptButton;