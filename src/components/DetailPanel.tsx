import type { LiveShip } from "../sim/useCruiseSimulation";
import { PORTS_BY_ID } from "../sim/cruiseData";
import { REGION_COLORS } from "./mapData";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

function formatCountdown(ms: number): string {
  const totalHours = Math.max(0, Math.round(ms / (60 * 60 * 1000)));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

interface DetailPanelProps {
  ship: LiveShip | undefined;
  currentMs: number;
  onClose: () => void;
}

export function DetailPanel({ ship, currentMs, onClose }: DetailPanelProps) {
  if (!ship) return null;

  const currentPort = ship.currentPortId ? PORTS_BY_ID[ship.currentPortId] : null;
  const previousPort = ship.previousPortId ? PORTS_BY_ID[ship.previousPortId] : null;
  const nextPort = ship.nextPortId ? PORTS_BY_ID[ship.nextPortId] : null;
  const homePort = PORTS_BY_ID[ship.homePortId];

  return (
    <div className="detail-panel">
      <button className="close-btn" onClick={onClose} aria-label="Close">
        &times;
      </button>
      <div className="detail-header">
        <span className="dot large" style={{ background: REGION_COLORS[ship.region] }} />
        <div>
          <div className="detail-name">{ship.name}</div>
          <div className="detail-type">{ship.itineraryName}</div>
        </div>
      </div>
      <dl className="detail-grid">
        <dt>Status</dt>
        <dd>{ship.status === "in_port" ? `In Port — ${currentPort?.name ?? "—"}` : "At Sea"}</dd>
        {ship.status === "at_sea" && (
          <>
            <dt>From</dt>
            <dd>{previousPort?.name ?? "—"}</dd>
          </>
        )}
        <dt>Next Port</dt>
        <dd>{nextPort?.name ?? "—"}</dd>
        <dt>{ship.status === "in_port" ? "Departs In" : "Arrives In"}</dt>
        <dd>
          {ship.status === "in_port"
            ? ship.departureMs != null
              ? formatCountdown(ship.departureMs - currentMs)
              : "—"
            : ship.nextArrivalMs != null
              ? formatCountdown(ship.nextArrivalMs - currentMs)
              : "—"}
        </dd>
        <dt>Speed</dt>
        <dd>{ship.speedKn.toFixed(1)} kn</dd>
        <dt>Heading</dt>
        <dd>{Math.round(ship.heading)}&deg;</dd>
        <dt>Position</dt>
        <dd>
          {ship.lat.toFixed(2)}, {ship.lng.toFixed(2)}
        </dd>
        <dt>Home Port</dt>
        <dd>{homePort?.name ?? "—"}</dd>
        <dt>Guests</dt>
        <dd>{ship.guestCapacity.toLocaleString()}</dd>
        <dt>Built</dt>
        <dd>{ship.yearBuilt}</dd>
        {ship.nextArrivalMs != null && (
          <>
            <dt>ETA</dt>
            <dd>{dateFormatter.format(ship.nextArrivalMs)}</dd>
          </>
        )}
      </dl>
    </div>
  );
}
