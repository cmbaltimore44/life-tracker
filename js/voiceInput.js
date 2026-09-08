import { showToast } from './toast.js';

const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let activeButton = null;

function setRecordingState(button, isRecording) {
  button.classList.toggle('recording', isRecording);
  button.title = isRecording ? 'Stop dictation' : 'Dictate';
}

function startRecording(button, textarea) {
  if (recognition) recognition.stop();

  const rec = new SpeechRecognitionCtor();
  rec.lang = navigator.language || 'en-US';
  rec.continuous = true;
  rec.interimResults = false;

  let baseValue = textarea.value;

  rec.onresult = (event) => {
    if (recognition !== rec) return;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (!event.results[i].isFinal) continue;
      const transcript = event.results[i][0].transcript.trim();
      if (!transcript) continue;
      const needsSpace = baseValue && !/\s$/.test(baseValue);
      baseValue += (needsSpace ? ' ' : '') + transcript;
      textarea.value = baseValue;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  rec.onerror = (event) => {
    if (recognition !== rec) return;
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      showToast('Microphone access was denied. Enable it in your browser settings to dictate.', { type: 'error' });
    } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
      showToast('Voice input stopped unexpectedly.', { type: 'error' });
    }
  };

  rec.onend = () => {
    if (recognition !== rec) return;
    setRecordingState(button, false);
    recognition = null;
    activeButton = null;
  };

  recognition = rec;
  activeButton = button;
  setRecordingState(button, true);
  rec.start();
}

export function stopVoiceInput() {
  if (recognition) recognition.stop();
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
