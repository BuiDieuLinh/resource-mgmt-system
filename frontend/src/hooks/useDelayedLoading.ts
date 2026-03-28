import { useState, useEffect } from 'react';

export function useDelayedLoading(isLoading: boolean, minMs = 400): boolean {
  const [delayed, setDelayed] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setDelayed(true);
      return;
    }
    const timer = setTimeout(() => setDelayed(false), minMs);
    return () => clearTimeout(timer);
  }, [isLoading, minMs]);

  return delayed;
}
