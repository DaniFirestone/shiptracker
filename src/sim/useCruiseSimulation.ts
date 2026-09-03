import { useEffect, useMemo, useRef, useState } from "react";
import { CRUISE_SHIPS, TIMELINE_END_MS, TIMELINE_START_MS, type CruiseShip } from "./cruiseData";
import { getShipStateAtTime, type LiveShipState } from "./cruiseState";

export interface LiveShip extends CruiseShip, LiveShipState {}

function buildLiveShip(ship: CruiseShip, timeMs: number): LiveShip {
  return { ...ship, ...getShipStateAtTime(ship, timeMs) };
}

const SNAPSHOT_INTERVAL_MS = 200;

/**
 * Drives the cruise timeline clock across the fixed 6-month data window.
 * `shipsRef` is recomputed every animation frame for the map to read
 * imperatively; `ships` is a throttled snapshot for React-driven UI
 * (sidebar, detail panel). `currentMs` is likewise throttled for display —
 * use `seek`/`setPlaying` to control the clock.
 */
export function useCruiseSimulation(initialTimeScale: number) {
  const initialShips = useMemo(() => CRUISE_SHIPS.map((s) => buildLiveShip(s, TIMELINE_START_MS)), []);
  const shipsRef = useRef<LiveShip[]>(initialShips);
  const currentMsRef = useRef(TIMELINE_START_MS);
  const timeScaleRef = useRef(initialTimeScale); // hours of sim time per real second
  const playingRef = useRef(true);

  const [ships, setShips] = useState<LiveShip[]>(initialShips);
  const [currentMs, setCurrentMs] = useState(TIMELINE_START_MS);
  const [timeScale, setTimeScaleState] = useState(initialTimeScale);
  const [playing, setPlayingState] = useState(true);

  useEffect(() => {
    let raf = 0;
    let lastTime = performance.now();
    let lastSnapshotTime = 0;

    const tick = (now: number) => {
      const realDeltaS = Math.min(1, (now - lastTime) / 1000);
      lastTime = now;

      if (playingRef.current) {
        let next = currentMsRef.current + realDeltaS * timeScaleRef.current * 3_600_000;
        if (next > TIMELINE_END_MS) next = TIMELINE_START_MS;
        currentMsRef.current = next;
      }

      shipsRef.current = CRUISE_SHIPS.map((s) => buildLiveShip(s, currentMsRef.current));

      if (now - lastSnapshotTime > SNAPSHOT_INTERVAL_MS) {
        lastSnapshotTime = now;
        setShips(shipsRef.current);
        setCurrentMs(currentMsRef.current);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function seek(ms: number) {
    const clamped = Math.min(TIMELINE_END_MS, Math.max(TIMELINE_START_MS, ms));
    currentMsRef.current = clamped;
    setCurrentMs(clamped);
    shipsRef.current = CRUISE_SHIPS.map((s) => buildLiveShip(s, clamped));
    setShips(shipsRef.current);
  }

  function setPlaying(value: boolean) {
    playingRef.current = value;
    setPlayingState(value);
  }

  function setTimeScale(value: number) {
    timeScaleRef.current = value;
    setTimeScaleState(value);
  }

  return { shipsRef, currentMsRef, ships, currentMs, timeScale, setTimeScale, playing, setPlaying, seek };
}
