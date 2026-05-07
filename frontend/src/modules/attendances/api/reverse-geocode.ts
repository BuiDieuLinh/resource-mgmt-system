const cache = new Map<string, string>();

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const key = `${lat},${lon}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'vi' } },
    );
    const data = await res.json();
    const address = data.display_name ?? `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    cache.set(key, address);
    return address;
  } catch {
    const fallback = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    cache.set(key, fallback);
    return fallback;
  }
}
