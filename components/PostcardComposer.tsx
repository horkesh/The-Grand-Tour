import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PostcardComposerProps {
  open: boolean;
  onClose: () => void;
  baseImage: string;
  selfieImage?: string;
  locationName: string;
  onSave: (dataUrl: string) => void;
}

type BorderStyle = 'none' | 'polaroid' | 'vintage' | 'stamp';
type FontStyle = 'serif' | 'handwritten' | 'bold';

const BORDER_STYLES: Record<BorderStyle, { label: string; preview: string }> = {
  none: { label: 'None', preview: 'No border' },
  polaroid: { label: 'Polaroid', preview: 'Classic white frame' },
  vintage: { label: 'Vintage', preview: 'Aged postcard' },
  stamp: { label: 'Stamp Edge', preview: 'Perforated border' },
};

const FONT_STYLES: Record<FontStyle, { label: string; family: string }> = {
  serif: { label: 'Classic', family: "'Playfair Display', Georgia, serif" },
  handwritten: { label: 'Handwritten', family: "'Caveat', cursive" },
  bold: { label: 'Modern', family: "'Inter', sans-serif" },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const PostcardComposer: React.FC<PostcardComposerProps> = ({
  open,
  onClose,
  baseImage,
  selfieImage,
  locationName,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textOverlay, setTextOverlay] = useState(locationName);
  const [subtitle, setSubtitle] = useState('20 Years of Us');
  const [border, setBorder] = useState<BorderStyle>('polaroid');
  const [font, setFont] = useState<FontStyle>('serif');
  const [rendering, setRendering] = useState(false);

  // Cache loaded images so we don't re-decode on every keystroke
  const bgImageRef = useRef<{ src: string; img: HTMLImageElement } | null>(null);
  const selfieImageRef = useRef<{ src: string; img: HTMLImageElement } | null>(null);

  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;

    // Load and cache base image
    let bg: HTMLImageElement;
    try {
      if (bgImageRef.current?.src === baseImage) {
        bg = bgImageRef.current.img;
      } else {
        bg = await loadImage(baseImage);
        bgImageRef.current = { src: baseImage, img: bg };
      }
    } catch {
      return; // Can't render without base image
    }

    ctx.drawImage(bg, 0, 0, W, H);

    // Apply border
    if (border === 'polaroid') {
      const pad = 40;
      const botPad = 160;
      ctx.save();
      ctx.fillStyle = '#fdfbf7';
      ctx.fillRect(0, 0, W, pad);
      ctx.fillRect(0, 0, pad, H);
      ctx.fillRect(W - pad, 0, pad, H);
      ctx.fillRect(0, H - botPad, W, botPad);
      ctx.drawImage(bg, pad, pad, W - pad * 2, H - pad - botPad);
      ctx.restore();
    } else if (border === 'vintage') {
      ctx.fillStyle = 'rgba(180, 140, 80, 0.15)';
      ctx.fillRect(0, 0, W, H);
      const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.7);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(180, 140, 80, 0.6)';
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, W - 40, H - 40);
    } else if (border === 'stamp') {
      ctx.fillStyle = '#fff';
      const r = 8;
      const gap = 24;
      for (let x = 0; x < W; x += gap) {
        ctx.beginPath(); ctx.arc(x, 0, r, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, H, r, 0, Math.PI * 2); ctx.fill();
      }
      for (let y = 0; y < H; y += gap) {
        ctx.beginPath(); ctx.arc(0, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(W, y, r, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Draw selfie if available (Polaroid corner)
    if (selfieImage && border === 'polaroid') {
      try {
        let selfie: HTMLImageElement;
        if (selfieImageRef.current?.src === selfieImage) {
          selfie = selfieImageRef.current.img;
        } else {
          selfie = await loadImage(selfieImage);
          selfieImageRef.current = { src: selfieImage, img: selfie };
        }
        const sw = 260;
        const sh = (selfie.height / selfie.width) * sw;
        const sx = W - sw - 80;
        const sy = 80;
        ctx.save();
        ctx.translate(sx + sw / 2, sy + sh / 2);
        ctx.rotate((5 * Math.PI) / 180);
        ctx.translate(-sw / 2, -sh / 2);
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#fdfbf7';
        ctx.fillRect(-10, -10, sw + 20, sh + 60);
        ctx.shadowBlur = 0;
        ctx.drawImage(selfie, 0, 0, sw, sh);
        ctx.restore();
      } catch {}
    }

    // Gradient for text area
    if (border !== 'polaroid') {
      const textGrad = ctx.createLinearGradient(0, H * 0.6, 0, H);
      textGrad.addColorStop(0, 'transparent');
      textGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = textGrad;
      ctx.fillRect(0, 0, W, H);
    }

    // Draw text
    const fontFamily = FONT_STYLES[font].family;
    const textY = border === 'polaroid' ? H - 100 : H - 80;
    const textColor = border === 'polaroid' ? '#333' : '#fff';

    if (textOverlay) {
      ctx.fillStyle = textColor;
      ctx.font = `bold 48px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.fillText(textOverlay, W / 2, textY);
    }

    if (subtitle) {
      ctx.fillStyle = border === 'polaroid' ? '#ac3d29' : 'rgba(255,255,255,0.7)';
      ctx.font = `italic 28px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.fillText(subtitle, W / 2, textY + 40);
    }
  }, [baseImage, selfieImage, textOverlay, subtitle, border, font]);

  // Debounced canvas preview render
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => { renderCanvas(); }, 200);
    return () => clearTimeout(timer);
  }, [open, renderCanvas]);

  const handleSave = async () => {
    setRendering(true);
    await renderCanvas();
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onSave(dataUrl);
    }
    setRendering(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold dark:text-white">Compose Postcard</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col lg:flex-row">
              {/* Preview */}
              <div className="flex-1 p-6 flex items-center justify-center bg-slate-50 dark:bg-black/30">
                <canvas
                  ref={canvasRef}
                  style={{ width: '100%', maxWidth: 400, height: 'auto', borderRadius: 12 }}
                />
              </div>

              {/* Controls */}
              <div className="lg:w-72 p-6 space-y-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/10">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                    Title Text
                  </label>
                  <input
                    type="text"
                    value={textOverlay}
                    onChange={(e) => setTextOverlay(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-lg text-sm text-slate-900 dark:text-white outline-none border border-slate-200 dark:border-white/10"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-lg text-sm text-slate-900 dark:text-white outline-none border border-slate-200 dark:border-white/10"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                    Border Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(BORDER_STYLES) as [BorderStyle, { label: string }][]).map(
                      ([key, val]) => (
                        <button
                          key={key}
                          onClick={() => setBorder(key)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            border === key
                              ? 'bg-[#194f4c] text-white'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {val.label}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                    Font Style
                  </label>
                  <div className="flex gap-2">
                    {(Object.entries(FONT_STYLES) as [FontStyle, { label: string }][]).map(
                      ([key, val]) => (
                        <button
                          key={key}
                          onClick={() => setFont(key)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            font === key
                              ? 'bg-[#194f4c] text-white'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {val.label}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={rendering}
                  className="w-full py-3 bg-[#194f4c] text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:scale-[1.02] transition-transform"
                >
                  {rendering ? 'Saving...' : 'Save Postcard'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PostcardComposer;
