import type { ShipSnapshot } from "../sim/useFleetSimulation";
import { PORTS_BY_ID } from "../sim/ports";
import { haversineNm } from "../sim/geo";
import { SHIP_COLORS } from "./mapData";

interface DetailPanelProps {
  ship: ShipSnapshot | undefined;
  onClose: () => void;
}

export function DetailPanel({ ship, onClose }: DetailPanelProps) {
  if (!ship) return null;

  const destination = PORTS_BY_ID[ship.destinationPortId];
  const distanceNm = destination
    ? haversineNm(ship.lat, ship.lng, destination.lat, destination.lng)
    : 0;
  const etaHours = ship.speedKn > 0 ? distanceNm / ship.speedKn : 0;
  const etaDays = Math.floor(etaHours / 24);
  const etaH = Math.floor(etaHours % 24);

  return (
    <div className="detail-panel">
      <button className="close-btn" onClick={onClose} aria-label="Close">
        &times;
      </button>
      <div className="detail-header">
        <span className="dot large" style={{ background: SHIP_COLORS[ship.type] }} />
        <div>
          <div className="detail-name">{ship.name}</div>
          <div className="detail-type">{ship.type}</div>
        </div>
      </div>
      <dl className="detail-grid">
        <dt>IMO</dt>
        <dd>{ship.imoLike}</dd>
        <dt>Speed</dt>
        <dd>{ship.speedKn.toFixed(1)} kn</dd>
        <dt>Heading</dt>
        <dd>{Math.round(ship.heading)}&deg;</dd>
        <dt>Position</dt>
        <dd>
          {ship.lat.toFixed(2)}, {ship.lng.toFixed(2)}
        </dd>
        <dt>Route</dt>
        <dd>{ship.laneName}</dd>
        <dt>Destination</dt>
        <dd>{destination?.name ?? "—"}</dd>
        <dt>Distance to go</dt>
        <dd>{Math.round(distanceNm).toLocaleString()} nm</dd>
        <dt>ETA</dt>
        <dd>
          {etaDays}d {etaH}h
        </dd>
      </dl>
    </div>
  );
}
