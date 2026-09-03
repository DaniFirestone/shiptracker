import type { Ship } from "./fleet";
import { LANES } from "./routes";
import { PORTS_BY_ID } from "./ports";
import { bearing, haversineNm, latLngToVec3, slerp, vec3ToLatLng } from "./geo";

const LANE_BY_ID = Object.fromEntries(LANES.map((l) => [l.id, l]));
const TRAIL_MAX_POINTS = 40;
const TRAIL_MIN_HOURS_BETWEEN_POINTS = 1.5;

function legDistanceNm(ship: Ship): number {
  const lane = LANE_BY_ID[ship.laneId];
  const from = PORTS_BY_ID[lane.ports[ship.legIndex]];
  const to = PORTS_BY_ID[lane.ports[(ship.legIndex + 1) % lane.ports.length]];
  return haversineNm(from.lat, from.lng, to.lat, to.lng);
}

function advanceLeg(ship: Ship) {
  const lane = LANE_BY_ID[ship.laneId];
  ship.legIndex = (ship.legIndex + 1) % lane.ports.length;
  ship.legStartHour += ship.legDurationH;
  ship.legDurationH = legDistanceNm(ship) / ship.speedKn;
  ship.destinationPortId = lane.ports[(ship.legIndex + 1) % lane.ports.length];
}

/** Advances a ship's position to the given simulation clock (in hours). Mutates in place. */
export function stepShip(ship: Ship, simHour: number) {
  const lane = LANE_BY_ID[ship.laneId];

  // Handle arbitrarily large time jumps (e.g. tab was backgrounded) safely.
  let guard = 0;
  while (simHour - ship.legStartHour >= ship.legDurationH && guard < 10000) {
    advanceLeg(ship);
    guard++;
  }

  const t = Math.min(1, Math.max(0, (simHour - ship.legStartHour) / ship.legDurationH));
  const fromPort = PORTS_BY_ID[lane.ports[ship.legIndex]];
  const toPort = PORTS_BY_ID[lane.ports[(ship.legIndex + 1) % lane.ports.length]];

  const fromVec = latLngToVec3(fromPort.lat, fromPort.lng);
  const toVec = latLngToVec3(toPort.lat, toPort.lng);

  const posVec = slerp(fromVec, toVec, t);
  const [lat, lng] = vec3ToLatLng(posVec);

  const lookaheadT = Math.min(1, t + 0.01);
  const aheadVec = slerp(fromVec, toVec, lookaheadT);
  const [aheadLat, aheadLng] = vec3ToLatLng(aheadVec);

  ship.lat = lat;
  ship.lng = lng;
  ship.heading = lookaheadT > t ? bearing(lat, lng, aheadLat, aheadLng) : ship.heading;

  if (simHour - ship.lastTrailHour >= TRAIL_MIN_HOURS_BETWEEN_POINTS) {
    ship.trail.push([lng, lat]);
    if (ship.trail.length > TRAIL_MAX_POINTS) ship.trail.shift();
    ship.lastTrailHour = simHour;
  }
}
