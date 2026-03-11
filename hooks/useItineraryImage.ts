import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { generateLocationImage } from '../services/geminiService';

export const useItineraryImage = (key: string, promptLocation: string, enabled: boolean = true) => {
  const { waypointImages, setWaypointImage } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we already have an image, or disabled, or currently loading, skip.
    if (!enabled || waypointImages[key] || isLoading) return;

    let mounted = true;

    const fetchImage = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // console.log(`Generative Image Request for: ${key}`);
        const img = await generateLocationImage(promptLocation);
        if (mounted && img) {
          setWaypointImage(key, img);
        }
      } catch (err: any) {
        if (mounted) {
          console.error(`Failed to generate image for ${key}:`, err);
          setError(err.message || 'Failed to generate image');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchImage();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, promptLocation, enabled, waypointImages, setWaypointImage]); // Removed isLoading from deps to prevent loops

  return { 
    image: waypointImages[key], 
    isLoading, 
    error 
  };
};