const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

/**
 * Fetch a place photo from Wikimedia Commons (free, no API key required).
 * Strategy: search Wikipedia for the place, grab the page thumbnail,
 * then fall back to a Wikimedia Commons search if needed.
 */
export async function fetchPlacePhoto(
  placeName: string,
  lat: number,
  lng: number,
  maxWidthPx = 800
): Promise<string> {
  // Strategy 1: Wikipedia geosearch → page thumbnail
  const geoUrl = `${WIKI_API}?action=query&generator=geosearch&ggscoord=${lat}|${lng}&ggsradius=10000&ggslimit=5&prop=pageimages&piprop=thumbnail&pithumbsize=${maxWidthPx}&format=json&origin=*`;
  try {
    const geoRes = await fetch(geoUrl);
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      const pages = geoData.query?.pages;
      if (pages) {
        // Try to find a page matching the place name, otherwise take the first with a thumbnail
        const pageList = Object.values(pages) as any[];
        const nameMatch = pageList.find(
          (p: any) => p.thumbnail?.source && p.title?.toLowerCase().includes(placeName.split('(')[0].trim().toLowerCase().split(' ')[0])
        );
        const anyThumb = pageList.find((p: any) => p.thumbnail?.source);
        const pick = nameMatch || anyThumb;
        if (pick?.thumbnail?.source) {
          return pick.thumbnail.source;
        }
      }
    }
  } catch { /* fall through */ }

  // Strategy 2: Wikipedia title search → page thumbnail
  const searchQuery = `${placeName} Italy`;
  const searchUrl = `${WIKI_API}?action=query&titles=${encodeURIComponent(searchQuery)}&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=${maxWidthPx}&format=json&origin=*`;
  try {
    const searchRes = await fetch(searchUrl);
    if (searchRes.ok) {
      const data = await searchRes.json();
      const pages = data.query?.pages;
      if (pages) {
        const page = Object.values(pages).find((p: any) => p.thumbnail?.source) as any;
        if (page?.thumbnail?.source) return page.thumbnail.source;
      }
    }
  } catch { /* fall through */ }

  // Strategy 3: Wikipedia text search → page thumbnail
  const textSearchUrl = `${WIKI_API}?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=3&prop=pageimages&piprop=thumbnail&pithumbsize=${maxWidthPx}&format=json&origin=*`;
  try {
    const textRes = await fetch(textSearchUrl);
    if (textRes.ok) {
      const data = await textRes.json();
      const pages = data.query?.pages;
      if (pages) {
        const page = Object.values(pages).find((p: any) => p.thumbnail?.source) as any;
        if (page?.thumbnail?.source) return page.thumbnail.source;
      }
    }
  } catch { /* fall through */ }

  // Strategy 4: Wikimedia Commons direct file search
  const commonsUrl = `${COMMONS_API}?action=query&generator=search&gsrsearch=${encodeURIComponent(placeName + ' Italy')}&gsrnamespace=6&gsrlimit=3&prop=imageinfo&iiprop=url&iiurlwidth=${maxWidthPx}&format=json&origin=*`;
  try {
    const commonsRes = await fetch(commonsUrl);
    if (commonsRes.ok) {
      const data = await commonsRes.json();
      const pages = data.query?.pages;
      if (pages) {
        const page = Object.values(pages).find((p: any) => p.imageinfo?.[0]?.thumburl) as any;
        if (page?.imageinfo?.[0]?.thumburl) return page.imageinfo[0].thumburl;
      }
    }
  } catch { /* fall through */ }

  throw new Error(`No photos found for "${placeName}"`);
}
