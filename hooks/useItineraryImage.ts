import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { fetchPlacePhoto } from '../services/placesService';

export const useItineraryImage = (key: string, placeName: string, lat: number, lng: number, enabled: boolean = true) => {
  const { waypointImages, setWaypointImage } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || waypointImages[key] || isLoading) return;

    let mounted = true;

    const fetchImage = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const photoUrl = await fetchPlacePhoto(placeName, lat, lng);
        if (mounted && photoUrl) {
          setWaypointImage(key, photoUrl);
        }
      } catch (err: any) {
        if (mounted) {
          console.error(`Failed to fetch place photo for ${key}:`, err);
          setError(err.message || 'Failed to fetch photo');
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
  }, [key, placeName, lat, lng, enabled, waypointImages, setWaypointImage]);

  return {
    image: waypointImages[key],
    isLoading,
    error
  };
};
