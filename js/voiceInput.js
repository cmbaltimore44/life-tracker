import { showToast } from './toast.js';

const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let activeButton = null;

function setRecordingState(button, isRecording) {
  button.classList.toggle('recording', isRecording);
  button.title = isRecording ? 'Stop dictation' : 'Dictate';
}

function resetState() {
  if (activeButton) setRecordingState(activeButton, false);
  recognition = null;
  activeButton = null;
}

function startRecording(button, textarea) {
  if (recognition) {
    try {
      recognition.stop();
    } catch {
      // already stopped
    }
    resetState();
  }

  const rec = new SpeechRecognitionCtor();
  rec.lang = navigator.language || 'en-US';
  rec.continuous = true;
  rec.interimResults = true;

  const baseValue = textarea.value;
  const needsLeadingSpace = baseValue && !/\s$/.test(baseValue);

  rec.onresult = (event) => {
    if (recognition !== rec) return;
    let transcript = '';
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    transcript = transcript.trim();
    textarea.value = baseValue + (needsLeadingSpace && transcript ? ' ' : '') + transcript;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  };

  rec.onerror = (event) => {
    if (recognition !== rec) return;
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      showToast('Microphone access was denied. Enable it in your browser settings to dictate.', { type: 'error' });
    } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
      showToast('Voice input stopped unexpectedly.', { type: 'error' });
    }
    resetState();
  };

  rec.onend = () => {
    if (recognition !== rec) return;
    resetState();
  };

  recognition = rec;
  activeButton = button;
  setRecordingState(button, true);
  rec.start();
}

export function stopVoiceInput() {
  if (recognition) {
    try {
      recognition.stop();
    } catch {
      // already stopped
    }
  }
  resetState();
}

export function initVoiceInput() {
  const buttons = document.querySelectorAll('.voice-btn');

  if (!SpeechRecognitionCtor) {
    buttons.forEach((btn) => {
      btn.hidden = true;
    });
    return;
  }

  buttons.forEach((button) => {
    const textarea = document.getElementById(button.dataset.voiceTarget);
    if (!textarea) return;

    button.addEventListener('click', () => {
      if (activeButton === button) {
        stopVoiceInput();
      } else {
        startRecording(button, textarea);
      }
    });
  });
}
