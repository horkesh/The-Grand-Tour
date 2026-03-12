import React, { useEffect, useState, useRef } from 'react';
import { create } from 'zustand';

interface ToastState {
  message: string | null;
  variant: 'info' | 'error' | 'success';
  _seq: number; // sequence counter to distinguish repeated identical messages
  show: (message: string, variant?: 'info' | 'error' | 'success') => void;
  clear: () => void;
}

const useToastStore = create<ToastState>((set) => ({
  message: null,
  variant: 'info',
  _seq: 0,
  show: (message, variant = 'info') => {
    set((s) => ({ message, variant, _seq: s._seq + 1 }));
  },
  clear: () => set({ message: null }),
}));

// Selector: components that only need to show toasts subscribe to `show` only
export const useToast = () => useToastStore((s) => s.show);

const VARIANT_STYLES = {
  info: 'bg-[#194f4c] text-white',
  error: 'bg-red-600 text-white',
  success: 'bg-emerald-600 text-white',
};

const Toast: React.FC = () => {
  const { message, variant, _seq, clear } = useToastStore();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (message) {
      // Clear any existing timer from a previous message
      if (timerRef.current) clearTimeout(timerRef.current);
      setVisible(true);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        timerRef.current = setTimeout(clear, 300);
      }, 3000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [_seq, clear]);

  if (!message) return null;

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[10000] transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
      <div className={`px-6 py-3 rounded-2xl shadow-2xl text-xs font-bold uppercase tracking-widest ${VARIANT_STYLES[variant]}`}>
        {message}
      </div>
    </div>
  );
};

export default Toast;
