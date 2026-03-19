import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { useToast } from '../components/Toast';

export const useGeolocation = () => {
  const setUserLocation = useStore(s => s.setUserLocation);
  const showToast = useToast();
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;
  const watchIdRef = useRef<number | null>(null);
  const hasWarnedRef = useRef(false);

  useEffect(() => {
    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading ?? undefined,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        if (!hasWarnedRef.current && err.code === err.PERMISSION_DENIED) {
          hasWarnedRef.current = true;
          showToastRef.current('Location access denied — map won\'t show your position.', 'info');
        }
      },
      {
        enableHighAccuracy: false,
        maximumAge: 30000,
        timeout: 10000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [setUserLocation]);
};
