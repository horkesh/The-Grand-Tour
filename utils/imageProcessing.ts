/** Try to load an image with CORS so we can read its pixels. Resolves to null
 *  if the host doesn't return Access-Control-Allow-Origin (e.g. italia.it),
 *  rather than rejecting — caller can fall back to a generated background. */
function loadCorsImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function paintFallbackBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // Teal → rust gradient that matches the app's brand palette.
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#194f4c');
  grad.addColorStop(1, '#ac3d29');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // Subtle diagonal noise overlay so it doesn't look flat
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let i = -h; i < w; i += 18) {
    ctx.fillRect(i, 0, 6, h);
  }
}

export const mergePostcardImage = async (
  baseImageUrl: string,
  source: HTMLVideoElement | HTMLImageElement,
  title: string,
  subtitle?: string,
): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Capture current frame from video OR uploaded photo
  const isVideo = 'videoWidth' in source;
  const sourceWidth = isVideo ? source.videoWidth : source.naturalWidth;
  const sourceHeight = isVideo ? source.videoHeight : source.naturalHeight;
  const videoCanvas = document.createElement('canvas');
  videoCanvas.width = sourceWidth || 720;
  videoCanvas.height = sourceHeight || 960;
  const videoCtx = videoCanvas.getContext('2d');
  if (!videoCtx) throw new Error('Could not get source canvas context');
  videoCtx.drawImage(source, 0, 0);

  // Background — try the provided URL with CORS; fall back to a generated
  // gradient if the host doesn't allow cross-origin reads (italia.it,
  // booking.com etc. don't, so the canvas would otherwise be tainted and
  // toDataURL would throw a SecurityError).
  const bgImg = await loadCorsImage(baseImageUrl);
  if (bgImg) {
    canvas.width = bgImg.width;
    canvas.height = bgImg.height;
    ctx.drawImage(bgImg, 0, 0);
  } else {
    canvas.width = 1600;
    canvas.height = 1200;
    paintFallbackBackground(ctx, canvas.width, canvas.height);
  }

  // Polaroid Config
  const photoWidth = canvas.width * 0.35;
  const photoHeight = (videoCanvas.height / videoCanvas.width) * photoWidth;
  const x = canvas.width * 0.55;
  const y = canvas.height * 0.1;

  ctx.save();
  ctx.translate(x + photoWidth / 2, y + photoHeight / 2);
  ctx.rotate((Math.random() * 10 - 5) * Math.PI / 180);
  ctx.translate(-(photoWidth / 2), -(photoHeight / 2));

  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#fdfbf7';
  const border = 15;
  const bottomBorder = 80;
  ctx.fillRect(-border, -border, photoWidth + border * 2, photoHeight + border + bottomBorder);
  ctx.shadowBlur = 0;

  ctx.drawImage(videoCanvas, 0, 0, photoWidth, photoHeight);

  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, photoWidth, photoHeight);

  ctx.fillStyle = '#333';
  ctx.font = 'bold 24px "Playfair Display", serif';
  ctx.textAlign = 'center';
  const textX = photoWidth / 2;
  const textY = photoHeight + 40;
  ctx.fillText(title, textX, textY);

  if (subtitle) {
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'italic 18px "Playfair Display", serif';
    ctx.fillText(subtitle, textX, textY + 30);
  }

  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.90);
};