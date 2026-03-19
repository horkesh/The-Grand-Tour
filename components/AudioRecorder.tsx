import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

interface AudioRecorderProps {
  cityId: string;
  locationName: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ cityId, locationName }) => {
  const { audioPostcards, addAudioPostcard, removeAudioPostcard } = useStore();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cityAudios = audioPostcards.filter((a) => a.cityId === cityId);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          addAudioPostcard({
            id: `audio-${Date.now()}`,
            cityId,
            audioData: base64,
            duration: recordingTime,
            timestamp: Date.now(),
            label: locationName,
          });
        };
        reader.readAsDataURL(blob);

        setRecordingTime(0);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }, [cityId, locationName, recordingTime, addAudioPostcard]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-3">
      {/* Record button */}
      <div className="flex items-center gap-3">
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full text-xs font-bold uppercase tracking-widest animate-pulse"
          >
            <div className="w-2 h-2 bg-white rounded-full" />
            Stop {formatTime(recordingTime)}
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
          >
            <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
            Record Audio
          </button>
        )}
        <span className="text-[10px] text-slate-400">
          {cityAudios.length} clip{cityAudios.length !== 1 ? 's' : ''} saved
        </span>
      </div>

      {/* Saved audio clips */}
      <AnimatePresence>
        {cityAudios.map((clip) => (
          <motion.div
            key={clip.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 bg-white dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5"
          >
            <button
              onClick={() => {
                const audio = new Audio(clip.audioData);
                audio.play();
              }}
              className="w-8 h-8 bg-[#194f4c] rounded-full flex items-center justify-center text-white shrink-0"
            >
              <svg className="w-3 h-3 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                {clip.label || locationName}
              </p>
              <p className="text-[10px] text-slate-400">
                {formatTime(clip.duration)} · {new Date(clip.timestamp).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => removeAudioPostcard(clip.id)}
              className="text-slate-300 hover:text-red-400 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AudioRecorder;
