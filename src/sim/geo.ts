// Spherical geometry helpers for great-circle ship movement.

export type Vec3 = [number, number, number];
export type LatLng = [number, number]; // [lat, lng]
export type LngLat = [number, number]; // [lng, lat] (GeoJSON order)

const EARTH_RADIUS_NM = 3440.065;

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function latLngToVec3(lat: number, lng: number): Vec3 {
  const phi = toRad(lat);
  const lambda = toRad(lng);
  return [Math.cos(phi) * Math.cos(lambda), Math.cos(phi) * Math.sin(lambda), Math.sin(phi)];
}

export function vec3ToLatLng(v: Vec3): LatLng {
  const [x, y, z] = v;
  const lat = toDeg(Math.asin(Math.min(1, Math.max(-1, z))));
  const lng = toDeg(Math.atan2(y, x));
  return [lat, lng];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Spherical linear interpolation between two points on the unit sphere. */
export function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const d = Math.min(1, Math.max(-1, dot(a, b)));
  const theta = Math.acos(d);
  if (theta < 1e-9) return a;
  const sinTheta = Math.sin(theta);
  const s0 = Math.sin((1 - t) * theta) / sinTheta;
  const s1 = Math.sin(t * theta) / sinTheta;
  return [a[0] * s0 + b[0] * s1, a[1] * s0 + b[1] * s1, a[2] * s0 + b[2] * s1];
}

/** Great-circle distance in nautical miles. */
export function haversineNm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(lng2 - lng1);
  const a =
    Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return EARTH_RADIUS_NM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Initial bearing in degrees (0-360, 0 = north) from point 1 to point 2. */
export function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLambda = toRad(lng2 - lng1);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Splits a lng/lat path into segments wherever it crosses the antimeridian,
 * so it renders correctly as a MultiLineString on a Web Mercator map instead
 * of drawing a spurious line straight across the map.
 */
export function splitAtAntimeridian(coords: LngLat[]): LngLat[][] {
  const segments: LngLat[][] = [];
  let current: LngLat[] = [];
  for (let i = 0; i < coords.length; i++) {
    const point = coords[i];
    if (current.length > 0) {
      const prev = current[current.length - 1];
      if (Math.abs(point[0] - prev[0]) > 180) {
        segments.push(current);
        current = [];
      }
    }
    current.push(point);
  }
  if (current.length > 0) segments.push(current);
  return segments;
}
