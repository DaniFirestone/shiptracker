import type { FeatureCollection } from "geojson";
import type { Ship } from "../sim/fleet";
import { splitAtAntimeridian } from "../sim/geo";
import { PORTS } from "../sim/ports";

export const SHIP_COLORS: Record<Ship["type"], string> = {
  Container: "#38bdf8",
  Tanker: "#fb923c",
  "Bulk Carrier": "#a3a3a3",
  "LNG Carrier": "#c084fc",
  Cargo: "#4ade80",
};

export function shipsToFeatureCollection(ships: Ship[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: ships.map((s) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.lng, s.lat] },
      properties: {
        id: s.id,
        name: s.name,
        type: s.type,
        heading: s.heading,
        icon: `ship-${s.type}`,
      },
    })),
  };
}

export function trailsToFeatureCollection(ships: Ship[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: ships
      .filter((s) => s.trail.length > 1)
      .flatMap((s) => {
        const segments = splitAtAntimeridian(s.trail);
        return segments
          .filter((seg) => seg.length > 1)
          .map((seg) => ({
            type: "Feature" as const,
            geometry: { type: "LineString" as const, coordinates: seg },
            properties: { id: s.id, type: s.type },
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
