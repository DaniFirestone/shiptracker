import type { Map as MlMap } from "maplibre-gl";
import type { Ship } from "../sim/fleet";
import { SHIP_COLORS } from "./mapData";

/** Draws a simple ship-arrow icon (pointing north/up) in the given color. */
function drawShipIcon(color: string, size: number): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(size / 2, size / 2);

  ctx.beginPath();
  ctx.moveTo(0, -size * 0.44);
  ctx.lineTo(size * 0.27, size * 0.36);
  ctx.lineTo(0, size * 0.2);
  ctx.lineTo(-size * 0.27, size * 0.36);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(10, 15, 25, 0.85)";
  ctx.lineWidth = size * 0.06;
  ctx.fill();
  ctx.stroke();

  return ctx.getImageData(0, 0, size, size);
}

export function registerShipIcons(map: MlMap) {
  const size = 48;
  (Object.keys(SHIP_COLORS) as Ship["type"][]).forEach((type) => {
    const id = `ship-${type}`;
    if (map.hasImage(id)) return;
    const img = drawShipIcon(SHIP_COLORS[type], size);
    map.addImage(id, img, { pixelRatio: 2 });
  });
}
