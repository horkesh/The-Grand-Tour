
export const mergePostcardImage = async (
  baseImageUrl: string,
  videoElement: HTMLVideoElement,
  title: string,
  subtitle?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Capture current video frame
    const videoCanvas = document.createElement('canvas');
    videoCanvas.width = videoElement.videoWidth;
    videoCanvas.height = videoElement.videoHeight;
    const videoCtx = videoCanvas.getContext('2d');
    if (!videoCtx) {
      reject(new Error('Could not get video canvas context'));
      return;
    }
    videoCtx.drawImage(videoElement, 0, 0);

    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.onload = () => {
      try {
        canvas.width = bgImg.width;
        canvas.height = bgImg.height;
        ctx.drawImage(bgImg, 0, 0);

        // Polaroid Config
        const photoWidth = canvas.width * 0.35;
        const photoHeight = (videoCanvas.height / videoCanvas.width) * photoWidth;
        const x = canvas.width * 0.55;
        const y = canvas.height * 0.1;

        // Draw Polaroid Frame
        ctx.save();
        ctx.translate(x + photoWidth / 2, y + photoHeight / 2);
        ctx.rotate((Math.random() * 10 - 5) * Math.PI / 180);
        ctx.translate(-(photoWidth / 2), -(photoHeight / 2));

        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 20;
        
        // Frame Background
        ctx.fillStyle = '#fdfbf7'; // Off-white polaroid paper color
        const border = 15;
        // Adjust bottom border for text space
        const bottomBorder = 80; 
        ctx.fillRect(-border, -border, photoWidth + border * 2, photoHeight + border + bottomBorder);
        
        // Reset Shadow for image
        ctx.shadowBlur = 0;
        
        // Draw User Photo
        ctx.drawImage(videoCanvas, 0, 0, photoWidth, photoHeight);
        
        // Inner shadow on photo for depth
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, photoWidth, photoHeight);

        // Text
        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px "Playfair Display", serif';
        ctx.textAlign = 'center';
        
        // Ensure text fits
        const textX = photoWidth / 2;
        const textY = photoHeight + 40;
        ctx.fillText(title, textX, textY);
        
        if (subtitle) {
          ctx.fillStyle = '#D4AF37'; // Gold
          ctx.font = 'italic 18px "Playfair Display", serif';
          ctx.fillText(subtitle, textX, textY + 30);
        }

        ctx.restore();

        resolve(canvas.toDataURL('image/jpeg', 0.90));
      } catch (e) {
        reject(e);
      }
    };
    bgImg.onerror = (e) => reject(new Error(`Failed to load background image: ${e}`));
    bgImg.src = baseImageUrl;
  });
};