const PLACES_API_BASE = 'https://places.googleapis.com/v1';
const BLOCKED_KEY = 'gt_places_api_blocked';

export function isPlacesApiBlocked(): boolean {
  try {
    return localStorage.getItem(BLOCKED_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearPlacesApiBlock(): void {
  try { localStorage.removeItem(BLOCKED_KEY); } catch { /* ignore */ }
}

function markPlacesApiBlocked(): void {
  try { localStorage.setItem(BLOCKED_KEY, '1'); } catch { /* ignore */ }
}

export class PlacesApiBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlacesApiBlockedError';
  }
}

export async function fetchPlacePhoto(
  placeName: string,
  lat: number,
  lng: number,
  maxWidthPx = 800
): Promise<string> {
  if (isPlacesApiBlocked()) {
    throw new PlacesApiBlockedError('Places API previously blocked — skipping fetch');
  }
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error('No API key configured');

  // Step 1: Text Search to find the place and get its photos
  const searchRes = await fetch(`${PLACES_API_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.photos',
    },
    body: JSON.stringify({
      textQuery: placeName,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 5000.0,
        },
      },
      maxResultCount: 1,
    }),
  });

  if (!searchRes.ok) {
    const text = await searchRes.text();
    // 403 / PERMISSION_DENIED / API key restriction — flip the kill switch so
    // subsequent loads don't keep hammering and showing the same toast.
    if (searchRes.status === 403 || /PERMISSION_DENIED|REQUEST_DENIED|API key not valid|not authorized/i.test(text)) {
      markPlacesApiBlocked();
      throw new PlacesApiBlockedError(`Places API blocked: ${text.slice(0, 200)}`);
    }
    throw new Error(`Places search failed (${searchRes.status}): ${text}`);
  }

  const data = await searchRes.json();
  const photoName = data.places?.[0]?.photos?.[0]?.name;
  if (!photoName) throw new Error(`No photos found for "${placeName}"`);

  // Step 2: Get the CDN URL via skipHttpRedirect
  const mediaRes = await fetch(
    `${PLACES_API_BASE}/${photoName}/media?maxWidthPx=${maxWidthPx}&skipHttpRedirect=true`,
    { headers: { 'X-Goog-Api-Key': apiKey } }
  );

  if (!mediaRes.ok) {
    throw new Error(`Photo media request failed (${mediaRes.status})`);
  }

  const mediaData = await mediaRes.json();
  if (!mediaData.photoUri) throw new Error('No photoUri in response');

  return mediaData.photoUri;
}
