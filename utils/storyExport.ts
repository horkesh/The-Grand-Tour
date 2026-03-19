import { ITALIAN_CITIES, ANNIVERSARY_DAY_ID } from '../constants';
import type { WeatherInfo } from '../types';

/**
 * Export the Story page as a self-contained HTML file.
 * All images are referenced by URL (not base64) to keep file size manageable.
 * Postcards that are data URLs are embedded inline.
 */
export function generateStoryHtml(opts: {
  stamps: string[];
  postcards: Record<string, string[]>;
  weatherData: Record<string, WeatherInfo>;
  waypointImages: Record<string, string>;
}): string {
  const { stamps, postcards, weatherData, waypointImages } = opts;
  const totalStamps = stamps.length;
  const totalPostcards = Object.values(postcards).flat().length;

  const dayChapters = ITALIAN_CITIES.map((city, i) => {
    const isAnniversary = city.id === ANNIVERSARY_DAY_ID;
    const isStamped = stamps.includes(city.id);
    const weather = weatherData[city.id];
    const dayImage = waypointImages[city.id] || city.image;
    const dayPostcards = Object.entries(postcards)
      .filter(([key]) => key === city.id || key.startsWith(`${city.id}_`))
      .flatMap(([, urls]) => urls as string[]);

    return `
      <section style="margin-bottom:80px;">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
          <div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:2px solid ${isAnniversary ? '#ac3d29' : isStamped ? '#194f4c' : '#cbd5e1'};background:${isAnniversary ? '#ac3d29' : isStamped ? '#194f4c' : '#f1f5f9'};color:${isStamped || isAnniversary ? '#fff' : '#94a3b8'};">
            ${isAnniversary ? '&hearts;' : i + 1}
          </div>
          <div>
            <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.3em;color:#94a3b8;margin:0;">
              Day ${i + 1} &middot; ${city.location}${weather ? ` &middot; ${weather.temp}` : ''}
            </p>
            <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#1e293b;margin:4px 0 0 0;">
              ${(city.title.split(': ')[1] || city.title).replace(/'/g, '&#39;')}
            </h2>
          </div>
        </div>

        ${isAnniversary ? '<p style="color:#ac3d29;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.3em;margin-bottom:16px;">May 6, 2006 &mdash; May 6, 2026 &middot; Twenty Years</p>' : ''}

        <div style="border-radius:16px;overflow:hidden;margin-bottom:24px;aspect-ratio:16/9;">
          <img src="${dayImage}" alt="${city.title.replace(/"/g, '&quot;')}" style="width:100%;height:100%;object-fit:cover;" />
        </div>

        <blockquote style="font-family:'Playfair Display',Georgia,serif;font-size:18px;font-style:italic;color:#64748b;border-left:4px solid #194f4c;padding-left:24px;margin:0 0 24px 0;">
          &ldquo;${city.milestone.replace(/'/g, '&#39;')}&rdquo;
        </blockquote>

        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;">
          ${city.plannedStops
            .map(
              (stop, si) => `
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;padding:6px 12px;border-radius:9999px;background:${stamps.includes(`${city.id}_${si}`) ? '#d1fae5' : '#f1f5f9'};color:${stamps.includes(`${city.id}_${si}`) ? '#047857' : '#94a3b8'};">
              ${stop.title.replace(/'/g, '&#39;')}
            </span>
          `,
            )
            .join('')}
        </div>

        ${
          dayPostcards.length > 0
            ? `<div style="display:flex;gap:16px;overflow-x:auto;padding-bottom:16px;">
            ${dayPostcards
              .map(
                (url) => `
              <div style="flex-shrink:0;background:white;padding:8px;padding-bottom:32px;box-shadow:0 4px 12px rgba(0,0,0,0.1);transform:rotate(-1deg);">
                <img src="${url}" alt="Memory" style="width:160px;height:112px;object-fit:cover;" />
              </div>
            `,
              )
              .join('')}
          </div>`
            : ''
        }

        ${isStamped ? '<p style="color:#10b981;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;margin-top:16px;">&#10003; Stamp Collected</p>' : ''}
      </section>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Our Grand Tour — Italy 2026</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Inter',sans-serif;background:#f9f7f4;color:#1e293b;-webkit-font-smoothing:antialiased;}
  img{max-width:100%;}
</style>
</head>
<body>
  <!-- Hero -->
  <div style="background:linear-gradient(135deg,#194f4c,#0d2f2d);min-height:60vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:80px 24px;">
    <div>
      <p style="color:rgba(255,255,255,0.4);font-size:12px;text-transform:uppercase;letter-spacing:0.4em;font-weight:700;margin-bottom:16px;">May 2 &ndash; 9, 2026</p>
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:56px;font-weight:700;color:white;margin-bottom:16px;">Our Grand Tour</h1>
      <p style="font-family:'Playfair Display',Georgia,serif;font-size:18px;font-style:italic;color:rgba(255,255,255,0.6);">The story of twenty years, told across Italy</p>
      <div style="display:flex;justify-content:center;gap:24px;margin-top:32px;color:rgba(255,255,255,0.3);font-size:12px;text-transform:uppercase;letter-spacing:0.2em;font-weight:700;">
        <span>${totalStamps} stamps</span>
        <span>&middot;</span>
        <span>${totalPostcards} photos</span>
        <span>&middot;</span>
        <span>8 days</span>
      </div>
    </div>
  </div>

  <!-- Chapters -->
  <div style="max-width:768px;margin:0 auto;padding:48px 24px;">
    ${dayChapters}

    <!-- Finale -->
    <div style="text-align:center;padding:64px 0;border-top:1px solid #e2e8f0;">
      <p style="font-size:40px;margin-bottom:24px;">&#127470;&#127481;</p>
      <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:32px;font-weight:700;color:#1e293b;margin-bottom:16px;">Fin del Viaggio</h2>
      <p style="font-family:'Playfair Display',Georgia,serif;font-size:18px;font-style:italic;color:#94a3b8;max-width:400px;margin:0 auto 32px;">
        Eight days of la dolce vita. Twenty years of love. Every stamp a memory, every photo a promise.
      </p>
      <div style="display:flex;justify-content:center;gap:48px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.2em;font-weight:700;">
        <div style="text-align:center;">
          <span style="display:block;font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#1e293b;margin-bottom:4px;">${totalStamps}</span>Stamps
        </div>
        <div style="text-align:center;">
          <span style="display:block;font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#1e293b;margin-bottom:4px;">${totalPostcards}</span>Photos
        </div>
        <div style="text-align:center;">
          <span style="display:block;font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#1e293b;margin-bottom:4px;">8</span>Days
        </div>
      </div>
    </div>
  </div>

  <footer style="text-align:center;padding:24px;color:#94a3b8;font-size:11px;">
    Made with love &middot; The Grand Tour &middot; Italy 2026
  </footer>
</body>
</html>`;
}

/** Download the story HTML as a file */
export function downloadStoryHtml(opts: Parameters<typeof generateStoryHtml>[0]) {
  const html = generateStoryHtml(opts);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'our-grand-tour-story.html';
  a.click();
  URL.revokeObjectURL(url);
}
