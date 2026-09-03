import { useMemo, useState } from "react";
import type { ShipSnapshot } from "../sim/useFleetSimulation";
import { SHIP_COLORS } from "./mapData";

const ALL_TYPES = Object.keys(SHIP_COLORS) as ShipSnapshot["type"][];

interface SidebarProps {
  ships: ShipSnapshot[];
  selectedShipId: string | null;
  onSelectShip: (id: string) => void;
  simHour: number;
  timeScale: number;
  onTimeScaleChange: (v: number) => void;
}

export function Sidebar({
  ships,
  selectedShipId,
  onSelectShip,
  simHour,
  timeScale,
  onTimeScaleChange,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(ALL_TYPES));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ships
      .filter((s) => activeTypes.has(s.type))
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ships, query, activeTypes]);

  function toggleType(type: string) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  const simDays = Math.floor(simHour / 24);
  const simH = Math.floor(simHour % 24);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>ShipTracker</h1>
        <div className="sim-clock">
          Sim time: <strong>Day {simDays}, {simH.toString().padStart(2, "0")}:00</strong>
        </div>
        <label className="speed-control">
          Speed: {timeScale}x
          <input
            type="range"
            min={1}
            max={200}
            step={1}
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
        {ALL_TYPES.map((type) => (
          <button
            key={type}
            className={`type-chip ${activeTypes.has(type) ? "active" : ""}`}
            style={{ borderColor: SHIP_COLORS[type] }}
            onClick={() => toggleType(type)}
          >
            <span className="dot" style={{ background: SHIP_COLORS[type] }} />
            {type}
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
            <span className="dot" style={{ background: SHIP_COLORS[s.type] }} />
            <div className="ship-row-text">
              <div className="ship-row-name">{s.name}</div>
              <div className="ship-row-meta">
                {s.type} &middot; {s.speedKn.toFixed(1)} kn
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
