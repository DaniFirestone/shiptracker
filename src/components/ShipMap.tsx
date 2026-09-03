import { useEffect, useRef } from "react";
import {
  Map as MlMap,
  NavigationControl,
  setWorkerUrl,
  type GeoJSONSource,
  type MapLayerMouseEvent,
  type MapMouseEvent,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Ship } from "../sim/fleet";
import { portsToFeatureCollection, shipsToFeatureCollection, trailsToFeatureCollection } from "./mapData";
import { registerShipIcons } from "./shipIcons";

// maplibre-gl's own new-Worker(new URL(...)) auto-detection breaks once
// bundled by Rollup (it silently fails to load, killing all GeoJSON
// rendering with no thrown error). The worker script and its sibling
// "shared" chunk are mirrored verbatim into public/ by
// scripts/sync-maplibre-worker.mjs (run on postinstall) so this plain,
// unbundled path works identically in dev and production.
setWorkerUrl("/maplibre-worker/maplibre-gl-worker.mjs");

const BG_COLOR = "#0a0f19";

// An inline style (no remote style.json fetch) so the map is ready and ships
// render immediately even if the basemap tile host is slow or unreachable —
// the raster tiles below are then a best-effort visual enhancement layered
// on top, fetched per-tile, rather than a single point of failure.
function buildMapStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      "basemap-tiles": {
        type: "raster",
        tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"],
        tileSize: 256,
        maxzoom: 20,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": BG_COLOR } },
      { id: "basemap-tiles-layer", type: "raster", source: "basemap-tiles", paint: { "raster-opacity": 0.9 } },
    ],
  };
}

const SHIPS_SOURCE = "ships";
const TRAILS_SOURCE = "trails";
const PORTS_SOURCE = "ports";
const SELECTED_SOURCE = "selected-ship";

interface ShipMapProps {
  shipsRef: React.RefObject<Ship[]>;
  selectedShipId: string | null;
  onSelectShip: (id: string | null) => void;
  flyToToken: number;
}

export function ShipMap({ shipsRef, selectedShipId, onSelectShip, flyToToken }: ShipMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const selectedIdRef = useRef(selectedShipId);
  selectedIdRef.current = selectedShipId;

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new MlMap({
      container: containerRef.current,
      style: buildMapStyle(),
      center: [20, 20],
      zoom: 2,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.addControl(new NavigationControl({ visualizePitch: false }), "top-left");

    // Tile fetch failures (e.g. blocked/offline network) are expected to be
    // non-fatal — the map still functions on the plain background.
    map.on("error", (e) => {
      console.warn("Map resource failed to load:", e.error?.message ?? e);
    });

    map.on("load", () => {
      registerShipIcons(map);

      map.addSource(TRAILS_SOURCE, {
        type: "geojson",
        data: trailsToFeatureCollection(shipsRef.current),
      });
      map.addLayer({
        id: "trails-layer",
        type: "line",
        source: TRAILS_SOURCE,
        paint: {
          "line-color": "#5ac8ff",
          "line-opacity": 0.28,
          "line-width": 1.3,
        },
      });

      map.addSource(PORTS_SOURCE, { type: "geojson", data: portsToFeatureCollection() });
      map.addLayer({
        id: "ports-layer",
        type: "circle",
        source: PORTS_SOURCE,
        paint: {
          "circle-radius": 4,
          "circle-color": "#ffd166",
          "circle-stroke-color": "#0a0f19",
          "circle-stroke-width": 1.5,
        },
      });
      map.addLayer({
        id: "ports-label",
        type: "symbol",
        source: PORTS_SOURCE,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 1.1],
          "text-anchor": "top",
          "text-font": ["Noto Sans Regular"],
        },
        paint: {
          "text-color": "#ffd166",
          "text-halo-color": "#0a0f19",
          "text-halo-width": 1.2,
        },
        minzoom: 2.5,
      });

      map.addSource(SELECTED_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "selected-halo",
        type: "circle",
        source: SELECTED_SOURCE,
        paint: {
          "circle-radius": 14,
          "circle-color": "#ffffff",
          "circle-opacity": 0.15,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
          "circle-stroke-opacity": 0.6,
        },
      });

      map.addSource(SHIPS_SOURCE, {
        type: "geojson",
        data: shipsToFeatureCollection(shipsRef.current),
      });
      map.addLayer({
        id: "ships-layer",
        type: "symbol",
        source: SHIPS_SOURCE,
        layout: {
          "icon-image": ["get", "icon"],
          "icon-rotate": ["get", "heading"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-size": ["interpolate", ["linear"], ["zoom"], 1, 0.35, 4, 0.55, 8, 0.85],
        },
      });

      map.on("mouseenter", "ships-layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "ships-layer", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("click", "ships-layer", (e: MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        const id = feature?.properties?.id as string | undefined;
        onSelectShip(id ?? null);
      });
      map.on("click", (e: MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["ships-layer"] });
        if (features.length === 0) onSelectShip(null);
      });

      let raf = 0;
      const render = () => {
        const ships = shipsRef.current;
        const shipsSrc = map.getSource(SHIPS_SOURCE) as GeoJSONSource | undefined;
        const trailsSrc = map.getSource(TRAILS_SOURCE) as GeoJSONSource | undefined;
        const selectedSrc = map.getSource(SELECTED_SOURCE) as GeoJSONSource | undefined;
        shipsSrc?.setData(shipsToFeatureCollection(ships));
        trailsSrc?.setData(trailsToFeatureCollection(ships));

        const selected = ships.find((s) => s.id === selectedIdRef.current);
        selectedSrc?.setData({
          type: "FeatureCollection",
          features: selected
            ? [
                {
                  type: "Feature",
                  geometry: { type: "Point", coordinates: [selected.lng, selected.lat] },
                  properties: {},
                },
              ]
            : [],
        });

        raf = requestAnimationFrame(render);
      };
      raf = requestAnimationFrame(render);
      map.once("remove", () => cancelAnimationFrame(raf));
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to a ship whenever it's (re)selected.
  useEffect(() => {
    if (!selectedShipId) return;
    const map = mapRef.current;
    if (!map) return;
    const ship = shipsRef.current.find((s) => s.id === selectedShipId);
    if (!ship) return;
    map.flyTo({ center: [ship.lng, ship.lat], zoom: Math.max(map.getZoom(), 4), speed: 0.9 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShipId, flyToToken]);

  return <div ref={containerRef} className="map-container" />;
}
