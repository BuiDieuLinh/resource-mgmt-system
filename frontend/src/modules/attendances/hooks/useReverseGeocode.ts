import { useQuery } from '@tanstack/react-query';

const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

export function useReverseGeocode(lat?: number | string | null, lng?: number | string | null) {
  const latNum = lat != null ? Number(lat) : null;
  const lngNum = lng != null ? Number(lng) : null;

  const enabled =
    latNum != null && lngNum != null && !Number.isNaN(latNum) && !Number.isNaN(lngNum);

  const key = enabled ? [round5(latNum), round5(lngNum)] : ['none'];

  return useQuery({
    queryKey: ['reverse-geocode', ...key],
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
        `&lat=${round5(latNum!)}&lon=${round5(lngNum!)}` +
        `&zoom=18&addressdetails=1&accept-language=vi`;

      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Reverse geocode failed');
      const data = (await res.json()) as {
        display_name?: string;
        address?: Record<string, string>;
      };

      const a = data.address ?? {};
      const compact = [
        a.house_number && a.road
          ? `${a.house_number} ${a.road}`
          : (a.road ?? a.pedestrian ?? a.neighbourhood),
        a.suburb ?? a.quarter ?? a.ward,
        a.city ?? a.town ?? a.village ?? a.county,
      ]
        .filter(Boolean)
        .join(', ');

      return compact || data.display_name || null;
    },
  });
}
