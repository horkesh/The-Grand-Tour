import { ITALIAN_CITIES } from '../constants';
import { TripSegment, SavedPOI, ChatMessage, WeatherInfo, Location } from '../types';

const TRIP_START = '2026-05-02';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Returns today's TripSegment if today falls within the May 2–9 window, else null. */
export function getCurrentTripDay(now: Date = new Date()): TripSegment | null {
  const start = startOfDay(new Date(`${TRIP_START}T00:00:00`));
  const today = startOfDay(now);
  const dayIdx = Math.round((today.getTime() - start.getTime()) / 86400000);
  if (dayIdx < 0 || dayIdx >= ITALIAN_CITIES.length) return null;
  return ITALIAN_CITIES[dayIdx];
}

export function getTomorrowTripDay(now: Date = new Date()): TripSegment | null {
  const today = getCurrentTripDay(now);
  if (!today) return null;
  const idx = ITALIAN_CITIES.indexOf(today);
  return idx >= 0 && idx + 1 < ITALIAN_CITIES.length ? ITALIAN_CITIES[idx + 1] : null;
}

export function findNearestCity(loc?: Location): TripSegment | null {
  if (!loc) return null;
  let best: TripSegment | null = null;
  let bestDist = Infinity;
  for (const c of ITALIAN_CITIES) {
    const dlat = c.center.lat - loc.lat;
    const dlng = c.center.lng - loc.lng;
    const d = dlat * dlat + dlng * dlng;
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best;
}

export interface ConciergeContext {
  userLocation?: Location;
  weatherData: Record<string, WeatherInfo>;
  savedPOIs: SavedPOI[];
  userName?: string;
  partnerName?: string;
  now?: Date;
}

/** Builds the system-instruction prompt for Gemini that makes the concierge trip-aware. */
export function buildSystemInstruction(ctx: ConciergeContext): string {
  const now = ctx.now || new Date();
  const today = getCurrentTripDay(now);
  const tomorrow = getTomorrowTripDay(now);
  const nearest = findNearestCity(ctx.userLocation);
  const weather = today ? ctx.weatherData[today.id] : undefined;
  const userName = ctx.userName || 'Haris';
  const partnerName = ctx.partnerName || 'Maja';
  const recentPOIs = ctx.savedPOIs.slice(-15);

  const parts: string[] = [];

  parts.push(
    `You are the AI concierge inside "The Grand Tour" — an 8-day road-trip companion app built for ${userName} and ${partnerName}, a couple celebrating their 20th wedding anniversary in central Italy from May 2 to May 9, 2026. They are driving a Jeep across Lazio, Tuscany, and Umbria.`,
  );
  parts.push(
    `Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`,
  );

  if (today) {
    parts.push(`\n## Today — ${today.title}`);
    parts.push(`Base location: ${today.location}.`);
    parts.push(today.itineraryContext);
    if (today.driveFromPrev) parts.push(`Drive from previous stop: ${today.driveFromPrev}.`);
    if (today.parking) parts.push(`Driving/ZTL note: ${today.parking}`);
    if (weather) parts.push(`Forecast: ${weather.temp}, ${weather.description} (${weather.condition}).`);
    parts.push(`Planned stops today:`);
    for (const stop of today.plannedStops) {
      const dur = stop.duration ? `, ~${stop.duration}` : '';
      parts.push(`- ${stop.title} (${stop.type}${dur}) at ${stop.lat.toFixed(4)}, ${stop.lng.toFixed(4)}`);
    }
  } else {
    const start = startOfDay(new Date(`${TRIP_START}T00:00:00`));
    const today0 = startOfDay(now);
    const beforeTrip = today0.getTime() < start.getTime();
    parts.push(
      beforeTrip
        ? `\n## Trip Status\nThe trip has not started yet. Departure is May 2, 2026.`
        : `\n## Trip Status\nThe 8-day trip has finished — they are now post-trip.`,
    );
    parts.push(`Full itinerary overview:`);
    for (const c of ITALIAN_CITIES) {
      parts.push(`- ${c.title}: ${c.location} — ${c.description}`);
    }
  }

  if (tomorrow) {
    parts.push(`\n## Tomorrow — ${tomorrow.title}`);
    parts.push(`${tomorrow.location}. ${tomorrow.itineraryContext}`);
    if (tomorrow.driveFromPrev) parts.push(`Drive: ${tomorrow.driveFromPrev}.`);
  }

  if (ctx.userLocation && nearest) {
    parts.push(`\n## Right now`);
    parts.push(
      `${userName}'s phone reports location ${ctx.userLocation.lat.toFixed(4)}, ${ctx.userLocation.lng.toFixed(4)} — nearest itinerary city: ${nearest.location}.`,
    );
  }

  if (recentPOIs.length) {
    parts.push(`\n## Saved places (${recentPOIs.length})`);
    for (const p of recentPOIs) {
      const where = p.cityId && p.cityId !== 'planned'
        ? ` — saved to ${ITALIAN_CITIES.find(c => c.id === p.cityId)?.location || p.cityId}`
        : '';
      parts.push(`- ${p.title}${where}${p.notes ? ` (note: ${p.notes.slice(0, 60)})` : ''}`);
    }
  }

  parts.push(`\n## How to behave`);
  parts.push(
    `- You are warm, knowledgeable, and Italian-coded — like a friend who lives in Italy. Drop occasional Italian words naturally (allora, magari, cin cin) without overdoing it.`,
  );
  parts.push(
    `- Be concise. Default to 2–4 short paragraphs. Save bullet lists for genuine lists (multiple options, opening hours, addresses).`,
  );
  parts.push(
    `- Always reason from today's plan, current location, weather, and the drive ahead. Generic answers are a failure — context-aware ones are the bar.`,
  );
  parts.push(
    `- Reference their saved places when relevant ("you already saved X — pair it with…"). Suggest meaningful additions, not duplicates.`,
  );
  parts.push(
    `- For anniversary moments (especially Day 5 — May 6, the official 20th anniversary), lean into romance, sensory detail, and memorable touches. Suggest specific gestures.`,
  );
  parts.push(
    `- Respect ZTL zones — when discussing driving or parking near old towns, name specific lots and warn about restricted zones.`,
  );
  parts.push(
    `- Use the Maps and Search tools to ground recommendations in current, real places. Never invent specific names, hours, or prices.`,
  );
  parts.push(
    `- If a question is ambiguous (e.g. "what's near us"), assume they mean today's planned area or current GPS — don't ask for clarification.`,
  );
  parts.push(
    `- It is okay to be opinionated. They want a recommendation, not a survey. Pick one and explain why.`,
  );

  parts.push(`\n## Formatting`);
  parts.push(
    `- The chat renders Markdown: use **double asterisks** for bold and *single asterisks* for italics. Don't write things like "* * thing" — use real Markdown.`,
  );
  parts.push(
    `- Whenever you mention a specific place by name (restaurant, sight, hotel, viewpoint, parking lot), wrap it as a Markdown link to its Google Maps search URL so they can tap straight through. Format: [Place Name](https://www.google.com/maps/search/?api=1&query=URL+ENCODED+PLACE+NAME+CITY). Use plus-signs for spaces in the query.`,
  );
  parts.push(
    `- Example: "Try [Osteria La Porta](https://www.google.com/maps/search/?api=1&query=Osteria+La+Porta+Monticchiello) for tonight — book ahead."`,
  );
  parts.push(
    `- For any place already on today's planned stops, prefer linking to that exact stop's coordinates: https://www.google.com/maps/search/?api=1&query=LAT,LNG (using the lat/lng listed above).`,
  );
  parts.push(
    `- Don't double up: each place gets one inline link, not also a footnote.`,
  );

  return parts.join('\n');
}

/** History to send back to Gemini for conversational continuity. */
export function buildConversationHistory(messages: ChatMessage[], maxTurns = 6): ChatMessage[] {
  // Most recent N turns, but exclude the just-added user message (caller passes it separately)
  return messages.slice(-maxTurns * 2);
}

/** Day-aware quick-prompt suggestions for the empty state. */
export function buildSuggestedPrompts(now: Date = new Date()): string[] {
  const today = getCurrentTripDay(now);
  if (!today) {
    return [
      `What should we pack for central Italy in early May?`,
      `Best gelato in Tuscany?`,
      `Quick Italian phrases we'll actually use?`,
      `Any apps or eSIMs to set up before we land?`,
    ];
  }
  const sight = today.plannedStops.find((s) => s.type === 'sight');
  const restaurant = today.plannedStops.find((s) => s.type === 'restaurant');
  const out: string[] = [];
  if (sight) out.push(`What should we know before visiting ${sight.title}?`);
  if (restaurant) out.push(`Is ${restaurant.title} worth the stop — what should we order?`);
  out.push(`Hidden gems near ${today.location} that aren't on our list?`);
  out.push(`What's a romantic surprise I could plan around ${today.location} today?`);
  return out;
}
