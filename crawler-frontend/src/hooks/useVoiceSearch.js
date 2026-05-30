import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export const useVoiceSearch = (onSearch) => {
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast('Listening...', { icon: '🎤', id: 'voice-toast', duration: 5000 });
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      toast.dismiss('voice-toast');
      onSearch(transcript);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      toast.dismiss('voice-toast');
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone permissions.');
      } else if (event.error !== 'no-speech') {
        toast.error('Voice search error: ' + event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      toast.dismiss('voice-toast');
    };

    try {
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  }, [onSearch]);

  return { isListening, startListening };
};
