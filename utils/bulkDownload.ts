/**
 * Bulk download all postcards as a ZIP file.
 * Uses JSZip loaded from CDN to keep the bundle small.
 */

// Dynamically load JSZip from CDN
async function loadJSZip(): Promise<any> {
  if ((window as any).JSZip) return (window as any).JSZip;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => resolve((window as any).JSZip);
    script.onerror = () => reject(new Error('Failed to load JSZip'));
    document.head.appendChild(script);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: header.split(':')[1]?.split(';')[0] || 'image/png' });
}

export async function downloadAllPostcards(
  postcards: Record<string, string[]>,
  getCityName: (key: string) => string,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const JSZip = await loadJSZip();
  const zip = new JSZip();

  const allImages: Array<{ key: string; url: string; idx: number }> = [];
  for (const [key, urls] of Object.entries(postcards)) {
    for (let i = 0; i < urls.length; i++) {
      allImages.push({ key, url: urls[i], idx: i });
    }
  }

  if (allImages.length === 0) return;

  for (let i = 0; i < allImages.length; i++) {
    const { key, url, idx } = allImages[i];
    const cityName = getCityName(key).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${cityName}_${idx + 1}.png`;

    if (url.startsWith('data:')) {
      const blob = dataUrlToBlob(url);
      zip.file(filename, blob);
    } else {
      // External URL — try to fetch
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        zip.file(filename, blob);
      } catch {
        // Skip if can't fetch
        console.warn(`Skipping ${filename} — could not fetch`);
      }
    }

    onProgress?.(i + 1, allImages.length);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'grand-tour-postcards.zip';
  a.click();
  URL.revokeObjectURL(downloadUrl);
}
