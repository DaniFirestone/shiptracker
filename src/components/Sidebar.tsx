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
  ships: LiveShip[]; // already filtered by query + activeRegions
  totalShipCount: number;
  selectedShipId: string | null;
  onSelectShip: (id: string) => void;
  currentMs: number;
  onSeek: (ms: number) => void;
  playing: boolean;
  onTogglePlaying: () => void;
  timeScale: number;
  onTimeScaleChange: (v: number) => void;
  query: string;
  onQueryChange: (q: string) => void;
  activeRegions: Set<CruiseRegion>;
  onToggleRegion: (region: CruiseRegion) => void;
}

export function Sidebar({
  ships,
  totalShipCount,
  selectedShipId,
  onSelectShip,
  currentMs,
  onSeek,
  playing,
  onTogglePlaying,
  timeScale,
  onTimeScaleChange,
  query,
  onQueryChange,
  activeRegions,
  onToggleRegion,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>ShipTracker</h1>
        <div className="cruise-line-name">{CRUISE_LINE_NAME} &middot; {totalShipCount} ships</div>

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
        onChange={(e) => onQueryChange(e.target.value)}
      />

      <div className="type-filters">
        {REGIONS.map((region) => (
          <button
            key={region}
            className={`type-chip ${activeRegions.has(region) ? "active" : ""}`}
            style={{ borderColor: REGION_COLORS[region] }}
            onClick={() => onToggleRegion(region)}
          >
            <span className="dot" style={{ background: REGION_COLORS[region] }} />
            {region}
          </button>
        ))}
      </div>

      <div className="ship-count">{ships.length} ships</div>

      <ul className="ship-list">
        {ships.map((s) => (
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
