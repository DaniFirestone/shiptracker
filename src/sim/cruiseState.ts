import { bearing, haversineNm, latLngToVec3, slerp, vec3ToLatLng } from "./geo";
import { PORTS_BY_ID, type CruiseShip, type ScheduleStop } from "./cruiseData";

export type ShipStatus = "in_port" | "at_sea";

export interface LiveShipState {
  lat: number;
  lng: number;
  heading: number;
  speedKn: number;
  status: ShipStatus;
  currentPortId: string | null;
  previousPortId: string | null;
  nextPortId: string | null;
  nextArrivalMs: number | null;
  departureMs: number | null;
}

interface StopMs extends ScheduleStop {
  arrivalMs: number;
  departureMs: number;
}

const scheduleMsCache = new WeakMap<CruiseShip, StopMs[]>();

function getScheduleMs(ship: CruiseShip): StopMs[] {
  let cached = scheduleMsCache.get(ship);
  if (!cached) {
    cached = ship.schedule.map((stop) => ({
      ...stop,
      arrivalMs: Date.parse(stop.arrival),
      departureMs: Date.parse(stop.departure),
    }));
    scheduleMsCache.set(ship, cached);
  }
  return cached;
}

/** Finds the last stop whose arrival is <= timeMs (assumes ascending order). */
function findStopIndex(schedule: StopMs[], timeMs: number): number {
  let lo = 0;
  let hi = schedule.length - 1;
  if (timeMs <= schedule[0].arrivalMs) return 0;
  if (timeMs >= schedule[hi].arrivalMs) return hi;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (schedule[mid].arrivalMs <= timeMs) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function getShipStateAtTime(ship: CruiseShip, timeMs: number): LiveShipState {
  const schedule = getScheduleMs(ship);
  const i = findStopIndex(schedule, timeMs);
  const stop = schedule[i];
  const port = PORTS_BY_ID[stop.portId];

  if (timeMs <= stop.departureMs || i === schedule.length - 1) {
    // In port (or clamped to the last known stop past the data range).
    const next = schedule[i + 1];
    return {
      lat: port.lat,
      lng: port.lng,
      heading: next ? bearing(port.lat, port.lng, PORTS_BY_ID[next.portId].lat, PORTS_BY_ID[next.portId].lng) : 0,
      speedKn: 0,
      status: "in_port",
      currentPortId: stop.portId,
      previousPortId: null,
      nextPortId: next ? next.portId : null,
      nextArrivalMs: next ? next.arrivalMs : null,
      departureMs: stop.departureMs,
    };
  }

  // At sea, sailing from `stop` to the next port.
  const next = schedule[i + 1];
  const nextPort = PORTS_BY_ID[next.portId];
  const legStartMs = stop.departureMs;
  const legEndMs = next.arrivalMs;
  const t = Math.min(1, Math.max(0, (timeMs - legStartMs) / (legEndMs - legStartMs)));

  const fromVec = latLngToVec3(port.lat, port.lng);
  const toVec = latLngToVec3(nextPort.lat, nextPort.lng);
  const posVec = slerp(fromVec, toVec, t);
  const [lat, lng] = vec3ToLatLng(posVec);

  const lookaheadT = Math.min(1, t + 0.01);
  const aheadVec = slerp(fromVec, toVec, lookaheadT);
  const [aheadLat, aheadLng] = vec3ToLatLng(aheadVec);
  const heading = lookaheadT > t ? bearing(lat, lng, aheadLat, aheadLng) : 0;

  const transitHours = (legEndMs - legStartMs) / (60 * 60 * 1000);
  const distanceNm = haversineNm(port.lat, port.lng, nextPort.lat, nextPort.lng);
  const speedKn = transitHours > 0 ? distanceNm / transitHours : 0;

  return {
    lat,
    lng,
    heading,
    speedKn,
    status: "at_sea",
    currentPortId: null,
    previousPortId: stop.portId,
    nextPortId: next.portId,
    nextArrivalMs: next.arrivalMs,
    departureMs: stop.departureMs,
  };
}

/** Port-to-port waypoints the ship passed through within the trailing window, for drawing a trail. */
export function getRecentTrail(ship: CruiseShip, timeMs: number, windowMs: number): [number, number][] {
  const schedule = getScheduleMs(ship);
  const windowStart = timeMs - windowMs;
  const points: [number, number][] = [];
  for (const stop of schedule) {
    if (stop.departureMs < windowStart) continue;
    if (stop.arrivalMs > timeMs) break;
    const port = PORTS_BY_ID[stop.portId];
    points.push([port.lng, port.lat]);
  }
  const current = getShipStateAtTime(ship, timeMs);
  points.push([current.lng, current.lat]);
  return points;
}
