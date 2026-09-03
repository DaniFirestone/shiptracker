import { useEffect, useMemo, useRef, useState } from "react";
import { generateFleet, type Ship } from "./fleet";
import { stepShip } from "./simulate";

export interface ShipSnapshot {
  id: string;
  name: string;
  type: Ship["type"];
  laneName: string;
  speedKn: number;
  lat: number;
  lng: number;
  heading: number;
  destinationPortId: string;
  imoLike: string;
}

function toSnapshot(s: Ship): ShipSnapshot {
  return {
    id: s.id,
    name: s.name,
    type: s.type,
    laneName: s.laneName,
    speedKn: s.speedKn,
    lat: s.lat,
    lng: s.lng,
    heading: s.heading,
    destinationPortId: s.destinationPortId,
    imoLike: s.imoLike,
  };
}

const SNAPSHOT_INTERVAL_MS = 500;

/**
 * Drives the fleet simulation clock. Positions live in a mutable ref
 * (`shipsRef`) that the map reads every animation frame directly, so
 * high-frequency movement never triggers a React re-render. A throttled
 * snapshot array is exposed separately for UI (sidebar, detail panel).
 */
export function useFleetSimulation(shipsPerLane: number, timeScale: number) {
  const initialShips = useMemo(() => generateFleet(shipsPerLane), [shipsPerLane]);
  const shipsRef = useRef<Ship[]>(initialShips);
  const simHourRef = useRef(0);
  const timeScaleRef = useRef(timeScale);
  const [snapshots, setSnapshots] = useState<ShipSnapshot[]>(() => initialShips.map(toSnapshot));
  const [simHour, setSimHour] = useState(0);

  useEffect(() => {
    timeScaleRef.current = timeScale;
  }, [timeScale]);

  useEffect(() => {
    let raf = 0;
    let lastTime = performance.now();
    let lastSnapshotTime = 0;

    const tick = (now: number) => {
      const realDeltaS = Math.min(1, (now - lastTime) / 1000); // clamp to avoid huge jumps on tab refocus
      lastTime = now;
      simHourRef.current += realDeltaS * timeScaleRef.current;

      for (const ship of shipsRef.current) {
        stepShip(ship, simHourRef.current);
      }

      if (now - lastSnapshotTime > SNAPSHOT_INTERVAL_MS) {
        lastSnapshotTime = now;
        setSnapshots(shipsRef.current.map(toSnapshot));
        setSimHour(simHourRef.current);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return { shipsRef, snapshots, simHour };
}
