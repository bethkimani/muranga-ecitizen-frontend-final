export type LatLng = { lat: number; lng: number };

/** Backend stores coordinates as a "lat,lng" string. */
export function parseCoords(value?: string | null): LatLng | null {
  if (!value) return null;
  const [a, b] = value.split(',').map((s) => parseFloat(s.trim()));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (Math.abs(a) > 90 || Math.abs(b) > 180) return null;
  return { lat: a, lng: b };
}

export function formatCoords(p: LatLng): string {
  return `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
}