import React, { useEffect, useRef, useState } from 'react';

const MAX_DURATION_SEC = 30;
const SIZE_LIMIT_BYTES = 700_000; // ~700 KB keeps Firestore docs under 1 MB

interface Props {
  onRecorded: (audioDataUrl: string, durationSec: number) => void;
  disabled?: boolean;
}

/**
 * Compact voice-note recorder built on MediaRecorder.
 * Returns a base64 data URL the caller can embed directly in Firestore.
 * Keeps recordings short (≤30s) so they comfortably fit Firestore's 1 MB
 * document limit even after base64 inflation.
 */
const VoiceRecorder: React.FC<Props> = ({ onRecorded, disabled }) => {
  const [state, setState] = useState<'idle' | 'recording' | 'preview' | 'error'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [previewDuration, setPreviewDuration] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    if (tickRef.current) window.clearInterval(tickRef.current);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const start = async () => {
    if (state !== 'idle') return;
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime || 'audio/webm' });
        if (blob.size > SIZE_LIMIT_BYTES) {
          setErrorMsg('Recording too long for upload — try a shorter clip.');
          setState('error');
          return;
        }
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = () => reject(r.error);
          r.readAsDataURL(blob);
        });
        const durationSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        setPreviewUrl(URL.createObjectURL(blob));
        setPreviewData(dataUrl);
        setPreviewDuration(durationSec);
        setState('preview');
      };
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start();
      setState('recording');
      setSeconds(0);
      tickRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setSeconds(elapsed);
        if (elapsed >= MAX_DURATION_SEC) stop();
      }, 250);
    } catch (e) {
      setErrorMsg(
        (e as { name?: string })?.name === 'NotAllowedError'
          ? 'Microphone permission denied.'
          : 'Could not start recording.',
      );
      setState('error');
    }
  };

  const stop = () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  const send = () => {
    if (!previewData) return;
    onRecorded(previewData, previewDuration);
    reset();
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewData(null);
    setPreviewDuration(0);
    setSeconds(0);
    setState('idle');
  };

  if (state === 'idle' || state === 'error') {
    return (
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={start}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#194f4c]/40 dark:border-teal-700/40 text-[#194f4c] dark:text-teal-300 text-xs font-bold hover:bg-[#194f4c]/5 disabled:opacity-50 transition-colors"
        >
          <span aria-hidden>🎙️</span>
          Record a voice note (≤{MAX_DURATION_SEC}s)
        </button>
        {state === 'error' && (
          <p className="text-[11px] text-[#ac3d29]">{errorMsg}</p>
        )}
      </div>
    );
  }

  if (state === 'recording') {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#ac3d29]/10 border border-[#ac3d29]/30">
        <div className="flex items-center gap-2 text-xs text-[#ac3d29] font-bold">
          <span className="w-2 h-2 rounded-full bg-[#ac3d29] animate-pulse" />
          Recording… {seconds}s
        </div>
        <button
          type="button"
          onClick={stop}
          className="px-3 py-1 rounded-full bg-[#ac3d29] text-white text-[11px] font-bold"
        >
          Stop
        </button>
      </div>
    );
  }

  // preview
  return (
    <div className="space-y-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-900/40">
      <audio src={previewUrl ?? undefined} controls className="w-full h-9" />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="flex-1 px-3 py-1.5 rounded-full bg-white dark:bg-white/10 text-slate-600 dark:text-slate-200 text-[11px] font-bold border border-slate-200 dark:border-white/10"
        >
          Re-record
        </button>
        <button
          type="button"
          onClick={send}
          className="flex-1 px-3 py-1.5 rounded-full bg-[#194f4c] text-white text-[11px] font-bold"
        >
          Use this clip ({previewDuration}s)
        </button>
      </div>
    </div>
  );
};

export default VoiceRecorder;
