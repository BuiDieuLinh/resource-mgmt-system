import { useState, useCallback } from 'react';

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

const MAX_RETRIES = 3;

export function useGPS() {
  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPosition = useCallback((): Promise<GPSPosition> => {
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by your browser';
      setError(msg);
      return Promise.reject(new Error(msg));
    }

    setLoading(true);
    setError(null);

    const attempt = (retriesLeft: number): Promise<GPSPosition> =>
      new Promise((resolve, reject) => {
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
            // code 1 = PERMISSION_DENIED — no point retrying
            if (err.code === 1) {
              const msg = 'Location permission denied. Please allow location access.';
              setError(msg);
              setLoading(false);
              reject(new Error(msg));
              return;
            }
            // code 0 = UNKNOWN (kCLErrorLocationUnknown) or code 3 = TIMEOUT — retryable
            if (retriesLeft > 0) {
              attempt(retriesLeft - 1)
                .then(resolve)
                .catch(reject);
            } else {
              const msg = 'Unable to get your location. Please try again.';
              setError(msg);
              setLoading(false);
              reject(new Error(msg));
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
      });

    return attempt(MAX_RETRIES);
  }, []);

  return { position, loading, error, getPosition };
}
