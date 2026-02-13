
import { GoogleGenAI, Type } from "@google/genai";
import { Location, PlannedStop, WeatherInfo } from "../types";

// Global state to manage rate limiting across different components
let isGlobalCooling = false;
const NON_RETRYABLE_STATUS = [400, 401, 403, 404];

// Simple session-level cache
const cache = {
  travelTimes: new Map<string, any>(),
  poiDetails: new Map<string, any>(),
  weather: new Map<string, WeatherInfo>(),
};

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  if (isGlobalCooling) {
    throw new Error("API is currently in cooling period.");
  }

  try {
    return await fn();
  } catch (error: any) {
    const errorStr = error?.message || "";
    const status = error?.status || 0;
    
    if (NON_RETRYABLE_STATUS.includes(status)) {
      throw error;
    }

    const isRateLimited = errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED');
    if (retries > 0) {
      const waitTime = isRateLimited ? delay * 5 : delay;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return withRetry(fn, retries - 1, delay * 2.5);
    }

    if (isRateLimited) {
      isGlobalCooling = true;
      setTimeout(() => { isGlobalCooling = false; }, 30000);
    }
    throw error;
  }
}

export const enrichTripPlan = async (prompt: string, userLocation?: Location) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: {
          retrievalConfig: userLocation ? {
            latLng: { latitude: userLocation.lat, longitude: userLocation.lng }
          } : undefined
        }
      },
    });

    return {
      text: response.text || "I couldn't find details for that location.",
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  });
};

export const generatePostcard = async (city: string, style: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A vintage travel postcard of ${city}, Italy. Style: ${style}. Include the text "20 Years of Us" in elegant, golden cursive at the bottom. Cinematic lighting, nostalgic atmosphere, high artistic quality.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "4:3" }
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  });
};

export const getWeatherForecast = async (location: string, date: string): Promise<WeatherInfo | null> => {
  const cacheKey = `${location}-${date}`;
  if (cache.weather.has(cacheKey)) return cache.weather.get(cacheKey)!;

  return withRetry(async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `What is the typical weather for ${location}, Italy on ${date}? Return JSON: {"temp": "22°C", "condition": "sunny", "icon": "sunny", "description": "Mild"}.`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      const data = JSON.parse(response.text?.match(/\{[\s\S]*\}/)?.[0] || "{}") as WeatherInfo;
      cache.weather.set(cacheKey, data);
      return data;
    } catch (e) { return null; }
  });
};
