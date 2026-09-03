import { useMemo, useState } from "react";
import type { LiveShip } from "../sim/useCruiseSimulation";
import { CRUISE_LINE_NAME, REGIONS, TIMELINE_END_MS, TIMELINE_START_MS, type CruiseRegion } from "../sim/cruiseData";
import { REGION_COLORS } from "./mapData";

const HOUR_MS = 60 * 60 * 1000;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

interface SidebarProps {
  ships: LiveShip[];
  selectedShipId: string | null;
  onSelectShip: (id: string) => void;
  currentMs: number;
  onSeek: (ms: number) => void;
  playing: boolean;
  onTogglePlaying: () => void;
  timeScale: number;
  onTimeScaleChange: (v: number) => void;
}

export function Sidebar({
  ships,
  selectedShipId,
  onSelectShip,
  currentMs,
  onSeek,
  playing,
  onTogglePlaying,
  timeScale,
  onTimeScaleChange,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const [activeRegions, setActiveRegions] = useState<Set<CruiseRegion>>(new Set(REGIONS));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ships
      .filter((s) => activeRegions.has(s.region))
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ships, query, activeRegions]);

  function toggleRegion(region: CruiseRegion) {
    setActiveRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>ShipTracker</h1>
        <div className="cruise-line-name">{CRUISE_LINE_NAME} &middot; {ships.length} ships</div>

        <div className="clock-row">
          <button className="play-btn" onClick={onTogglePlaying} aria-label={playing ? "Pause" : "Play"}>
            {playing ? "⏸" : "▶"}
          </button>
          <strong className="clock-date">{dateFormatter.format(currentMs)}</strong>
        </div>

        <input
          className="timeline-scrubber"
          type="range"
          min={TIMELINE_START_MS}
          max={TIMELINE_END_MS}
          step={HOUR_MS}
          value={currentMs}
          onChange={(e) => onSeek(Number(e.target.value))}
        />

        <label className="speed-control">
          Speed: {(timeScale / 24).toFixed(1)} days/sec
          <input
            type="range"
            min={2}
            max={240}
            step={2}
            value={timeScale}
            onChange={(e) => onTimeScaleChange(Number(e.target.value))}
          />
        </label>
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="Search ships..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="type-filters">
        {REGIONS.map((region) => (
          <button
            key={region}
            className={`type-chip ${activeRegions.has(region) ? "active" : ""}`}
            style={{ borderColor: REGION_COLORS[region] }}
            onClick={() => toggleRegion(region)}
          >
            <span className="dot" style={{ background: REGION_COLORS[region] }} />
            {region}
          </button>
        ))}
      </div>

      <div className="ship-count">{filtered.length} ships</div>

      <ul className="ship-list">
        {filtered.map((s) => (
          <li
            key={s.id}
            className={`ship-row ${s.id === selectedShipId ? "selected" : ""}`}
            onClick={() => onSelectShip(s.id)}
          >
            <span className="dot" style={{ background: REGION_COLORS[s.region] }} />
            <div className="ship-row-text">
              <div className="ship-row-name">{s.name}</div>
              <div className="ship-row-meta">
                {s.itineraryName} &middot;{" "}
                {s.status === "in_port" ? "In Port" : `${s.speedKn.toFixed(1)} kn`}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
