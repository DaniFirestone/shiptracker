import { LANES } from "./routes";
import { PORTS_BY_ID } from "./ports";
import { haversineNm } from "./geo";

export type ShipType = "Container" | "Tanker" | "Bulk Carrier" | "LNG Carrier" | "Cargo";

export interface Ship {
  id: string;
  name: string;
  type: ShipType;
  laneId: string;
  laneName: string;
  speedKn: number;
  imoLike: string;
  // Mutable simulation state
  legIndex: number;
  legStartHour: number;
  legDurationH: number;
  lat: number;
  lng: number;
  heading: number;
  trail: [number, number][]; // [lng, lat], most recent last
  lastTrailHour: number;
  destinationPortId: string;
}

const SPEED_RANGES: Record<ShipType, [number, number]> = {
  Container: [18, 24],
  Tanker: [12, 16],
  "Bulk Carrier": [11, 15],
  "LNG Carrier": [16, 20],
  Cargo: [13, 18],
};

const PREFIX: Record<ShipType, string> = {
  Container: "MV",
  Tanker: "MT",
  "Bulk Carrier": "MV",
  "LNG Carrier": "LNG",
  Cargo: "MV",
};

const NAME_WORDS = [
  "Horizon", "Endeavour", "Meridian", "Voyager", "Pioneer", "Atlantic", "Pacific",
  "Northern", "Southern", "Odyssey", "Zenith", "Aurora", "Titan", "Neptune",
  "Mariner", "Constellation", "Liberty", "Star", "Trader", "Navigator",
  "Explorer", "Fortune", "Harmony", "Vanguard", "Crest", "Summit", "Compass",
  "Beacon", "Sentinel", "Legacy",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomShipName(type: ShipType, index: number): string {
  return `${PREFIX[type]} ${randomFrom(NAME_WORDS)} ${index}`;
}

function randomImoLike(): string {
  let s = "IMO ";
  for (let i = 0; i < 7; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function legDistanceNm(laneId: string, legIndex: number): number {
  const lane = LANES.find((l) => l.id === laneId)!;
  const from = PORTS_BY_ID[lane.ports[legIndex]];
  const to = PORTS_BY_ID[lane.ports[(legIndex + 1) % lane.ports.length]];
  return haversineNm(from.lat, from.lng, to.lat, to.lng);
}

const SHIP_TYPES: ShipType[] = ["Container", "Tanker", "Bulk Carrier", "LNG Carrier", "Cargo"];

/** Builds the initial fleet, scattering ships at random points along their lanes. */
export function generateFleet(shipsPerLane = 6): Ship[] {
  const ships: Ship[] = [];
  let counter = 1;

  for (const lane of LANES) {
    for (let i = 0; i < shipsPerLane; i++) {
      const type = randomFrom(SHIP_TYPES);
      const [minSpeed, maxSpeed] = SPEED_RANGES[type];
      const speedKn = minSpeed + Math.random() * (maxSpeed - minSpeed);
      const legIndex = Math.floor(Math.random() * lane.ports.length);
      const legDist = legDistanceNm(lane.id, legIndex);
      const legDurationH = legDist / speedKn;
      const legStartHour = -Math.random() * legDurationH; // stagger progress within the leg

      const fromPort = PORTS_BY_ID[lane.ports[legIndex]];
      const toPortId = lane.ports[(legIndex + 1) % lane.ports.length];

      ships.push({
        id: `${lane.id}-${counter}`,
        name: randomShipName(type, counter),
        type,
        laneId: lane.id,
        laneName: lane.name,
        speedKn: Math.round(speedKn * 10) / 10,
        imoLike: randomImoLike(),
        legIndex,
        legStartHour,
        legDurationH,
        lat: fromPort.lat,
        lng: fromPort.lng,
        heading: 0,
        trail: [],
        lastTrailHour: -Infinity,
        destinationPortId: toPortId,
      });
      counter++;
    }
  }

  return ships;
}
