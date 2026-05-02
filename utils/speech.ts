// Italian text-to-speech using the Web Speech API.
// Free, offline, no API cost. Voices load async on some browsers (iOS Safari)
// so we cache the chosen Italian voice once it becomes available.

let cachedItalianVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

function pickItalianVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // Prefer named high-quality Italian voices when available
  const preferred = ['Alice', 'Federica', 'Luca', 'Paola', 'Tessa'];
  for (const name of preferred) {
    const v = voices.find((v) => v.name.includes(name) && v.lang.startsWith('it'));
    if (v) return v;
  }
  return voices.find((v) => v.lang === 'it-IT') || voices.find((v) => v.lang.startsWith('it')) || null;
}

function ensureVoices(): Promise<void> {
  if (voicesLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const tryPick = () => {
      cachedItalianVoice = pickItalianVoice();
      if (cachedItalianVoice || synth.getVoices().length > 0) {
        voicesLoaded = true;
        resolve();
      }
    };
    tryPick();
    if (voicesLoaded) return;
    synth.addEventListener('voiceschanged', () => {
      tryPick();
      resolve();
    }, { once: true });
    // Safety fallback in case voiceschanged never fires
    setTimeout(() => {
      voicesLoaded = true;
      resolve();
    }, 1500);
  });
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export async function speakItalian(text: string, opts: { slow?: boolean } = {}): Promise<void> {
  if (!isSpeechSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel(); // stop any in-flight utterance
  await ensureVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'it-IT';
  utterance.rate = opts.slow ? 0.6 : 0.95;
  utterance.pitch = 1;
  if (cachedItalianVoice) utterance.voice = cachedItalianVoice;
  synth.speak(utterance);
}

export function cancelSpeech(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
