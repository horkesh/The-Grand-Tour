/**
 * Re-encode a base64 data URL at a smaller width / lower quality. Useful
 * when we need a thumbnail-grade version of a full-quality image for
 * Firestore feed docs (1 MB document limit). Returns a JPEG data URL.
 */
export function shrinkDataUrl(dataUrl: string, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas ctx unavailable');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('failed to decode source data URL'));
    img.src = dataUrl;
  });
}
