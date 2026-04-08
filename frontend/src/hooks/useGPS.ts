import { useState, useCallback } from 'react';

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function useGPS() {
  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPosition = useCallback((): Promise<GPSPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'Geolocation is not supported by your browser';
        setError(msg);
        reject(new Error(msg));
        return;
      }
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const gps: GPSPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setPosition(gps);
          setLoading(false);
          resolve(gps);
        },
        (err) => {
          const msg =
            err.code === 1
              ? 'Location permission denied. Please allow location access.'
              : 'Unable to get your location. Please try again.';
          setError(msg);
          setLoading(false);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }, []);

  return { position, loading, error, getPosition };
}
