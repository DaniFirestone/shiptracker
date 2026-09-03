import type { FeatureCollection } from "geojson";
import { splitAtAntimeridian } from "../sim/geo";
import { PORTS, type CruiseRegion } from "../sim/cruiseData";
import { getRecentTrail } from "../sim/cruiseState";
import type { LiveShip } from "../sim/useCruiseSimulation";

export const REGION_COLORS: Record<CruiseRegion, string> = {
  Caribbean: "#38bdf8",
  Bahamas: "#fbbf24",
  Mediterranean: "#c084fc",
};

const TRAIL_WINDOW_MS = 4 * 24 * 60 * 60 * 1000;

export function shipsToFeatureCollection(ships: LiveShip[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: ships.map((s) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.lng, s.lat] },
      properties: {
        id: s.id,
        name: s.name,
        region: s.region,
        heading: s.heading,
        icon: `ship-${s.region}`,
      },
    })),
  };
}

export function trailsToFeatureCollection(ships: LiveShip[], currentMs: number): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: ships.flatMap((s) => {
      const trail = getRecentTrail(s, currentMs, TRAIL_WINDOW_MS);
      if (trail.length < 2) return [];
      const segments = splitAtAntimeridian(trail);
      return segments
        .filter((seg) => seg.length > 1)
        .map((seg) => ({
          type: "Feature" as const,
          geometry: { type: "LineString" as const, coordinates: seg },
          properties: { id: s.id, region: s.region },
        }));
    }),
  };
}

export function portsToFeatureCollection(): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: PORTS.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { id: p.id, name: p.name },
    })),
  };
}
